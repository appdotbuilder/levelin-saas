
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createAgencyInputSchema,
  createUserInputSchema,
  createContactInputSchema,
  updateContactInputSchema,
  createDealInputSchema,
  updateDealInputSchema,
  createLandingPageInputSchema,
  createContactInteractionInputSchema
} from './schema';

// Import handlers
import { createAgency } from './handlers/create_agency';
import { getAgencies } from './handlers/get_agencies';
import { getAgencyBySubdomain } from './handlers/get_agency_by_subdomain';
import { updateAgency } from './handlers/update_agency';
import { createUser } from './handlers/create_user';
import { getUsersByAgency } from './handlers/get_users_by_agency';
import { createContact } from './handlers/create_contact';
import { getContactsByAgency } from './handlers/get_contacts_by_agency';
import { updateContact } from './handlers/update_contact';
import { searchContacts } from './handlers/search_contacts';
import { createDeal } from './handlers/create_deal';
import { getDealsByAgency } from './handlers/get_deals_by_agency';
import { updateDeal } from './handlers/update_deal';
import { searchDeals } from './handlers/search_deals';
import { createLandingPage } from './handlers/create_landing_page';
import { getLandingPagesByAgency } from './handlers/get_landing_pages_by_agency';
import { publishLandingPage } from './handlers/publish_landing_page';
import { createContactInteraction } from './handlers/create_contact_interaction';
import { getContactInteractions } from './handlers/get_contact_interactions';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Agency management
  createAgency: publicProcedure
    .input(createAgencyInputSchema)
    .mutation(({ input }) => createAgency(input)),
  
  getAgencies: publicProcedure
    .query(() => getAgencies()),
  
  getAgencyBySubdomain: publicProcedure
    .input(z.object({ subdomain: z.string() }))
    .query(({ input }) => getAgencyBySubdomain(input.subdomain)),
  
  updateAgency: publicProcedure
    .input(z.object({ 
      id: z.number(), 
      updates: createAgencyInputSchema.partial() 
    }))
    .mutation(({ input }) => updateAgency({ id: input.id, ...input.updates })),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  getUsersByAgency: publicProcedure
    .input(z.object({ agencyId: z.number() }))
    .query(({ input }) => getUsersByAgency(input.agencyId)),

  // Contact management
  createContact: publicProcedure
    .input(createContactInputSchema)
    .mutation(({ input }) => createContact(input)),
  
  getContactsByAgency: publicProcedure
    .input(z.object({ agencyId: z.number() }))
    .query(({ input }) => getContactsByAgency(input.agencyId)),
  
  updateContact: publicProcedure
    .input(updateContactInputSchema)
    .mutation(({ input }) => updateContact(input)),
  
  searchContacts: publicProcedure
    .input(z.object({ agencyId: z.number(), query: z.string() }))
    .query(({ input }) => searchContacts(input.agencyId, input.query)),

  // Deal management (CRM)
  createDeal: publicProcedure
    .input(createDealInputSchema)
    .mutation(({ input }) => createDeal(input)),
  
  getDealsByAgency: publicProcedure
    .input(z.object({ agencyId: z.number() }))
    .query(({ input }) => getDealsByAgency(input.agencyId)),
  
  updateDeal: publicProcedure
    .input(updateDealInputSchema)
    .mutation(({ input }) => updateDeal(input)),
  
  searchDeals: publicProcedure
    .input(z.object({ agencyId: z.number(), query: z.string() }))
    .query(({ input }) => searchDeals(input.agencyId, input.query)),

  // Landing page builder
  createLandingPage: publicProcedure
    .input(createLandingPageInputSchema)
    .mutation(({ input }) => createLandingPage(input)),
  
  getLandingPagesByAgency: publicProcedure
    .input(z.object({ agencyId: z.number() }))
    .query(({ input }) => getLandingPagesByAgency(input.agencyId)),
  
  publishLandingPage: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => publishLandingPage(input.id)),

  // Contact interactions (timeline)
  createContactInteraction: publicProcedure
    .input(createContactInteractionInputSchema)
    .mutation(({ input }) => createContactInteraction(input)),
  
  getContactInteractions: publicProcedure
    .input(z.object({ contactId: z.number() }))
    .query(({ input }) => getContactInteractions(input.contactId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`levelin.com TRPC server listening at port: ${port}`);
}

start();
