import express from 'express';
import Redis from 'ioredis';
import chalk from 'chalk';
import cluster from 'cluster';
import {
  createCreditEvent,
  createInitialCreditScore,
  recalculateScore,
} from './utils';
import { CreditReport, RequestWithBody } from './types';

if (cluster.isWorker) {
  console.log(chalk.magenta(`Worker started. Worker PID: ${process.pid}`));
}

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

const redis = new Redis();

let requestNumber = 0;

app.use((req, _res, next) => {
  ++requestNumber;
  console.log(chalk.gray(`PID ${process.pid}: Request #${requestNumber} to ${req.path}`));
  next();
});

app.get('/health', (_req, res) => {
  res.send({
    healthy: true,
  });
});

app.get('/:ssn', async (req: RequestWithBody, res, _next) => {
  const { ssn } = req.params;
  if (!ssn || ssn.length !== 8) {
    res.status(400).send({
      message: 'Cannot provide a credit score without a valid 8 digit SSN.',
    });
    return;
  }

  const creditScoreString: string | null = await redis.get(ssn);

  if (creditScoreString) {
    try {
      let creditScore = JSON.parse(creditScoreString) as CreditReport;

      const newEvent = createCreditEvent();
      creditScore.events.push(newEvent);

      creditScore = recalculateScore(creditScore);

      await redis.set(ssn, JSON.stringify(creditScore));

      res.send(creditScore);
      return;
    } catch (e) {
      const errMessage = 'Could not parse the credit score using the string in the redis cache. Going to delete it. Please try again later!';

      console.log(chalk.red());
      await redis.del(ssn);
      res.status(500).send({
        message: errMessage,
      });
      return;
    }
  }

  const creditScore = createInitialCreditScore();

  await redis.set(ssn, JSON.stringify(creditScore));

  res.send(creditScore);
});

app.listen(PORT, () => {
  console.log(chalk.greenBright(`Application PID ${process.pid} now listening on PORT ${PORT}`));
});
