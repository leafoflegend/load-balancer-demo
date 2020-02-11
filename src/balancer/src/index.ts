import os from 'os';
import chalk from 'chalk';
import cluster from 'cluster';

if (cluster.isMaster) {
  console.log(chalk.greenBright(`Master process started PID ${process.pid}`));

  const cpus = os.cpus();

  for (let i = 0; i < cpus.length; ++i) {
    cluster.fork();
  }

  cluster.on('exit', (_worker, code, signal) => {
    console.log(chalk.yellow(`Worker exited with code ${code} and signal ${signal}, going to respawn.`));
  });
} else {
  import('../../services/credit_scores/src/index')
    .then(() => {
      console.log(chalk.yellow(`Successfully spawned ${process.pid} child.`));
    })
    .catch(e => {
      console.log(chalk.red(`Failed to spawn ${process.pid} child.`));
      console.error(e);
    });
}
