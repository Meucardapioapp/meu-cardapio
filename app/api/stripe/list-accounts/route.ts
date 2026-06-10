import Stripe from "stripe";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
);

export async function GET() {
  const accounts = await stripe.accounts.list({
    limit: 20,
  });

  return Response.json(
    accounts.data.map((account) => ({
      id: account.id,

      charges_enabled:
        account.charges_enabled,

      payouts_enabled:
        account.payouts_enabled,

      details_submitted:
        account.details_submitted,

      currently_due:
        account.requirements?.currently_due,

      eventually_due:
        account.requirements?.eventually_due,

      past_due:
        account.requirements?.past_due,

      disabled_reason:
        account.requirements?.disabled_reason,
    }))
  );
}