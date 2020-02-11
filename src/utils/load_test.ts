import { ArgumentParser } from 'argparse';
import chalk from 'chalk';
import axios from 'axios';

const parser = new ArgumentParser({
  version: '0.0.1',
  addHelp: true,
  description: 'Load Tester for Credit Scores Service',
});

parser.addArgument(
  ['--load', '-l'],
  {
    defaultValue: 1000,
    help: 'An integer representing the number of requests to send.',
    type: 'int',
  }
);

parser.addArgument(
  ['--port', '-p'],
  {
    defaultValue: 3000,
    help: 'An integer representing the port on localhost to hit.',
    type: 'int',
  },
);

const args: {
  load: number,
  port: number,
} = parser.parseArgs();

type CreateSingleDigit = () => number;
const createSingleDigit: CreateSingleDigit = () => Math.floor(Math.random() * 10);

type CreateSSN = () => string;
const createSSN: CreateSSN = () => {
  let ssnString: string = '';

  for (let i = 0; i < 8; ++i) {
    ssnString += createSingleDigit();
  }

  return ssnString;
};

interface ResponseMetrics {
  time: number;
  response: any;
  success: boolean;
}

interface Metrics {
  totalTime: number;
  successes: number;
  errors: number;
}

const responses: { [responseCount: number]: ResponseMetrics } = {};

const { load, port } = args;

const runLoadTest = () => {
  console.log(chalk.cyan(`Starting load test running with ${load} requests that will run against http://localhost:${port}`));

  const runRequest = (requestNum: number): Promise<any> => {
    let startTime = Date.now();

    return axios.get(`http://localhost:${port}/${createSSN()}`)
      .then(({ data }) => {
        const totalTime = Date.now() - startTime;
        responses[requestNum] = {
          response: data,
          time: totalTime,
          success: true,
        };
      })
      .catch(e => {
        console.log(chalk.yellow(`Error on request ${requestNum}.`));
        console.error(e);

        const totalTime = Date.now() - startTime;
        responses[requestNum] = {
          response: null,
          time: totalTime,
          success: false,
        };
      });
  };

  const allResponses: Promise<any>[] = [];

  for (let i = 0; i < args.load; ++i) {
    allResponses.push(runRequest(i));
  }

  const processResults = (): void => {
    const metrics = Object.values(responses).reduce<Metrics>((results, response) => {
      const successCount = response.success ? 1 : 0;
      const errorCount = response.success ? 0 : 1;

      return {
        totalTime: results.totalTime + response.time,
        successes: results.successes + successCount,
        errors: results.errors + errorCount,
      }
    }, {
      totalTime: 0,
      successes: 0,
      errors: 0,
    });

    const average = metrics.totalTime / load;

    if (!metrics.errors && metrics.successes === load) {
      console.log(chalk.green('=== SUCCESS ==='));

      console.log(chalk.cyan(`Average Response Time: ${average} ms`));
    } else {
      console.log(chalk.red('=== FAILURE ==='));

      console.log(chalk.cyan(`Average Response Time: ${average} ms`));
      console.log(chalk.yellow(`Success Count: ${metrics
        .successes}`));
      console.log(chalk.yellow(`Error Count: ${metrics
        .errors}`));
    }
  };

  return Promise.all(allResponses)
    .then(() => {
      processResults();
      process.exit(0);
    })
    .catch(() => {
      processResults();
      process.exit(1);
    });
};

const delay = (time = 1000, err = false) => new Promise((res, rej) => {
  setTimeout(() => {
    if (err) rej('Timed out!');
    else res();
  }, time);
});

const pingService = () => {
  return Promise.race([
    axios.get(` http://localhost:${port}/health`)
      .then(({ data: { healthy } }) => healthy),
    delay(),
  ]);
};

const runHealthTest = async (retries = 0, maxRetries = 3) => {
  if (retries === 0) {
    console.log(chalk.green(`Running health test against port ${port} before running load test. Ensuring that it is up and ready.`));
  } else {
    console.log(chalk.yellow(`Re-running health test. Try: ${retries}`));
  }

  try {
    await delay()
      .then(pingService);
  } catch (e) {
    if (retries < maxRetries) {
      await runHealthTest(retries + 1, maxRetries);
    } else {
      throw new Error(`After ${retries} retries. Aborted waiting on service on port ${port}. Please ensure the service being load tests has a health route, and is up and ready when this is run.`);
    }
  }
};

const main = async () => {
    console.log(chalk.greenBright('Starting...'));
    await runHealthTest();
    await runLoadTest();
};

main();
