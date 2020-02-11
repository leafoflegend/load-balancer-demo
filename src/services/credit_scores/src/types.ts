import { Request } from 'express';

export interface RequestWithBody extends Request {
  body: { [key: string]: any };
}

export type CreditEventType = 'INQUIRY' | 'LOAN' | 'DELINQUENCY';

export interface CreditEvent {
  type: CreditEventType;
  impact: number;
}

export interface CreditReport {
  average: number;
  bureau: {
    [key: string]: number;
  };
  events: CreditEvent[];
  age: number;
}
