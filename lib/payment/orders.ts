import { pagarmeRequest } from "./client";

interface CreatePixOrderParams {
  customer: {
    name: string;
    email: string;
    document: string;
    phone: string;
  };

  items: {
    name: string;
    quantity: number;
    amount: number;
  }[];
}

export interface PagarmeOrderResponse {
  id: string;

  charges: {
    id: string;

    status: string;

    last_transaction: {
      qr_code: string;

      qr_code_url: string;

      expires_at: string;
    };
  }[];
}

export async function createPixOrder({
  customer,
  items,
}: CreatePixOrderParams): Promise<PagarmeOrderResponse> {
  return pagarmeRequest<PagarmeOrderResponse>("/orders", {
    method: "POST",

    body: JSON.stringify({
      customer: {
        name: customer.name,
        email: customer.email,
        type: "individual",
        document: customer.document,

        phones: {
          mobile_phone: {
            country_code: "55",
            area_code: customer.phone.substring(0, 2),
            number: customer.phone.substring(2),
          },
        },
      },

      items: items.map((item) => ({
        amount: item.amount,
        description: item.name,
        quantity: item.quantity,
        code: crypto.randomUUID(),
      })),

      payments: [
        {
          payment_method: "pix",

          pix: {
            expires_in: 3600,
          },
        },
      ],
    }),
  });
}