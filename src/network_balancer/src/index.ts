import express from 'express';
import Redis from 'ioredis';

// Lets assume was configured to work across the network.
const redis = new Redis();

const allNetworkedMachines = [
  'a',
  'b',
  'c',
];

const MAX: number = 250;
let lastIdx = 0;

const app = express();

// Semaphore

const networkedMachineURLS = {
  a: 'blah',
  b: 'blah',
  c: 'blah',
};

app.get('/', async (req, _res, _next) => {
  const currentQueues: { [key: string]: string | null } = {
    a: await redis.get('a'),
    b: await redis.get('b'),
    c: await redis.get('c'),
  };

  // Round Robin
  let sent = false;
  let totalTries = 0;

  while (!sent && totalTries !== allNetworkedMachines.length) {
    ++totalTries;
    const curIdx = (lastIdx + 1) % allNetworkedMachines.length;
    const curMachine = allNetworkedMachines[curIdx] as keyof typeof currentQueues;
    const currentQueue = typeof currentQueues === 'string'
      ? parseInt(currentQueues[curMachine])
      : MAX;

    if (currentQueue < MAX) {
      // @ts-ignore
      req.pipe(networkedMachineURLS[curMachine]);
    }

    ++lastIdx;
  }

  // Fake, not real, meant to be an example.
  // aws.addEntity('machine')
  //   .then(machine => {
  //     allNetworkedMachines.push(machine.name);
  //     networkedMachineURLS[machine.name] = machine.url;
  //   })
});



