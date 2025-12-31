
import { Customer, Estimate } from './types';

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'QuikTrip Corp', type: 'Owner', email: 'bids@quiktrip.com', phone: '918-615-7000' },
  { id: 'c2', name: 'Manhattan Construction', type: 'GC', phone: '918-555-0100', email: 'estimating@manhattan.com' },
  { id: 'c3', name: 'Legacy Development', type: 'Developer', phone: '918-222-3333' },
  { id: 'c4', name: 'Flintco, LLC', type: 'GC', phone: '918-587-8451', email: 'tulsa.bids@flintco.com' },
];

export const INITIAL_ESTIMATES: Estimate[] = [
  {
    id: 'est1',
    name: 'QuikTrip #1245 Remodel',
    customerId: 'c1',
    location: 'Bixby, OK',
    status: 'Won',
    total: 85200,
    dueDate: '2024-06-15',
    memo: 'Full interior remodel including cold storage expansion.',
    exclusions: 'Permits and fees, landscape repair.',
    lineItems: [
      { id: 'l1', name: 'Demolition', description: 'Internal walls and slab', qty: 1, rate: 12000, amount: 12000 },
      { id: 'l2', name: 'Concrete', description: 'Pad reinforcement', qty: 450, rate: 85, amount: 38250 },
      { id: 'l5', name: 'Interior Finishes', description: 'Painting and wall protection', qty: 1, rate: 34950, amount: 34950 },
    ],
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2
  },
  {
    id: 'est2',
    name: 'City Hall Annex',
    customerId: 'c2',
    location: 'Tulsa, OK',
    status: 'Submitted',
    total: 1245000,
    dueDate: '2024-07-22',
    memo: 'Structure only bid for GC package.',
    exclusions: 'Interior finishes, HVAC, Electrical.',
    lineItems: [
      { id: 'l3', name: 'Structural Steel', description: 'A36 Beams', qty: 12, rate: 8500, amount: 102000 },
      { id: 'l6', name: 'Foundation', description: 'Piers and grade beams', qty: 1, rate: 1143000, amount: 1143000 },
    ],
    updatedAt: Date.now() - 1000 * 60 * 60 * 12
  },
  {
    id: 'est3',
    name: 'Downtown Lofts Ph II',
    customerId: 'c3',
    location: 'Tulsa, OK',
    status: 'Draft',
    total: 312000,
    dueDate: '2024-08-05',
    memo: 'Preliminary pricing for investor review.',
    exclusions: 'Structural engineering.',
    lineItems: [
      { id: 'l4', name: 'Framing', description: 'Metal stud framing', qty: 5200, rate: 18, amount: 93600 },
      { id: 'l7', name: 'Drywall', description: 'Type X fire rated', qty: 12000, rate: 18.2, amount: 218400 },
    ],
    updatedAt: Date.now()
  }
];
