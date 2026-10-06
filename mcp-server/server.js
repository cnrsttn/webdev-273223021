const readline = require('node:readline');
const fs = require('node:fs');
const path = require('node:path');

// The lectures, read once when the server starts.
const lectures = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'lectures.json'), 'utf8')
);

// A tool result: one text part, and whether the tool failed.
function textResult(id, text, isError) {
  return {
    jsonrpc: '2.0',
    id: id,
    result: {
      content: [
        {
          type: 'text',
          text: text
        }
      ],
      isError: isError
    }
  };
}

// The tools this server offers.
const tools = [
  {
    name: 'find_lecture',
    description: ' Find information about a lecture.',
    inputSchema: {
      type: 'object',
      properties: {
        number: {
          type: 'integer',
          description: 'Lecture number, 1 to 10'
        }
      },
      required: ['number'],
    },
  },
  {
    name: 'find_topic',
    description: 'Find course lectures that contain a specific topic. Use it when asked which lecture covers a particular subject.',
    inputSchema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'Topic to search for in the course lectures'
        }
      },
      required: ['topic'],
    },
  },
];

// Print one reply as one line of JSON on stdout.
function send(reply) {
  process.stdout.write(JSON.stringify(reply) + '\n');
}

// Decide what to answer. Return the reply, or null to answer nothing.
function handle(msg) {

  // Initialize handshake.
  if (msg.method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id: msg.id,
      result: {
        protocolVersion: msg.params.protocolVersion,
        capabilities: { tools: {} },
        serverInfo: {
          name: 'lectures',
          version: '0.1.0'
        },
      },
    };
  }

  // A notification has no id and gets no reply.
  if (msg.method === 'notifications/initialized') {
    return null;
  }

  // Return the tools offered by this server.
  if (msg.method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id: msg.id,
      result: {
        tools: tools
      }
    };
  }

  // Run a tool.
  if (msg.method === 'tools/call') {
    const name = msg.params.name;
    const args = msg.params.arguments || {};

    // find_lecture tool
    if (name === 'find_lecture') {
      const lecture = lectures.find(
        (l) => l.number === args.number
      );

      // The lecture does not exist.
      if (!lecture) {
        return textResult(
          msg.id,
          'There is no lecture ' +
            args.number +
            '. The course has lectures 1 to 10.',
          true
        );
      }

      return textResult(
        msg.id,
        'Lecture ' +
          lecture.number +
          ': ' +
          lecture.title +
          '. Topics: ' +
          lecture.topics,
        false
      );
    }

    // Our own tool: find_topic
    if (name === 'find_topic') {
      const topic = args.topic.toLowerCase();

      const matches = lectures.filter(
        (l) =>
          l.title.toLowerCase().includes(topic) ||
          l.topics.toLowerCase().includes(topic)
      );

      const text = matches
        .map(
          (l) =>
            'Lecture ' +
            l.number +
            ': ' +
            l.title +
            '. Topics: ' +
            l.topics
        )
        .join('\n');

      return textResult(
        msg.id,
        text,
        false
      );
    }

    // A tool we never offered.
    return {
      jsonrpc: '2.0',
      id: msg.id,
      error: {
        code: -32602,
        message: 'Unknown tool: ' + name
      }
    };
  }

  // Any other request we do not know.
  if (msg.id !== undefined) {
    return {
      jsonrpc: '2.0',
      id: msg.id,
      error: {
        code: -32601,
        message: 'Unknown method: ' + msg.method
      }
    };
  }

  return null;
}

const lines = readline.createInterface({
  input: process.stdin
});

lines.on('line', (line) => {
  console.error('got: ' + line);

  const reply = handle(JSON.parse(line));

  if (reply) send(reply);
});