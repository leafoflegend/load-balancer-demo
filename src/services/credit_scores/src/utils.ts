import { CreditReport, CreditEvent, CreditEventType } from './types';

type GenInitialScore = () => number;
const genInitialScore: GenInitialScore = () => {
  return Math.ceil(Math.random() * 300) + 500;
};

type GenBureauScores = (startingCredit: number, range: number) => {
  Equifax: number;
  Transunion: number;
  Experian: number;
}
const genBureauScores: GenBureauScores = (startingCredit, range) => {
  return {
    Equifax: startingCredit * (1 + (Math.random() * range)),
    Transunion: startingCredit * (1 + (Math.random() * range)),
    Experian: startingCredit * (1 + (Math.random() * range)),
  }
};

const creditEventTypes: CreditEventType[] = ['INQUIRY', 'DELINQUENCY', 'LOAN'];

type CreateCreditEvent = () => CreditEvent;
const createCreditEvent: CreateCreditEvent = () => {
  const randomEvent = creditEventTypes[Math.ceil(Math.random() * creditEventTypes.length)];

  const negativeOrPositive = [-1, 1];
  const multiplier = negativeOrPositive[Math.ceil(Math.random()) * negativeOrPositive.length];

  return {
    type: randomEvent,
    impact: Math.ceil(Math.random() * 35) * multiplier,
  };
};

type AverageScores = (bureauScores: CreditReport['bureau']) => number;
const averageScores: AverageScores = (bureauScores) => {
  const bureauScoresValues = Object.values(bureauScores);

  return Math.ceil(
    bureauScoresValues.reduce((total, bureau) => total + bureau) / bureauScoresValues.length,
  );
};

type CreateInitialCreditScore = () => CreditReport;
const createInitialCreditScore: CreateInitialCreditScore = () => {
  const initialCreditAge = Math.ceil(Math.random() * 8);
  const bureauScores = genBureauScores(genInitialScore(), 0.05);

  const average = averageScores(bureauScores);

  return {
    average,
    bureau: bureauScores,
    age: initialCreditAge,
    events: [],
  };
};

type RecalculateScore = (creditReport: CreditReport) => CreditReport;
const recalculateScore: RecalculateScore = (creditReport) => {
  const totalChange = creditReport.events.reduce<number>((total, event) => {
    return total + event.impact;
  }, 0);

  const newBureauScores = Object.entries(creditReport.bureau).reduce<{[key: string]: number}>((bureauScores, [bureauName, bureauScore]) => {
    return {
      ...bureauScores,
      [bureauName]: bureauScore * (totalChange * (0.9 + Math.ceil(Math.random() * 0.2))),
    };
  }, {});

  return {
    ...creditReport,
    average: averageScores(newBureauScores),
    bureau: newBureauScores,
  };
};

export {
  createCreditEvent,
  createInitialCreditScore,
  recalculateScore,
}
