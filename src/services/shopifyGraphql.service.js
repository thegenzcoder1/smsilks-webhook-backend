const axios = require("axios");

const SHOPIFY_URL = `${process.env.SHOPIFY_STORE}/admin/api/2024-01/graphql.json`;

exports.fetchPaidUnfulfilledOrders = async (cursor = null) => {
  const query = `
  query ($cursor: String) {
    orders(
      first: 250,
      after: $cursor,
      query: "financial_status:paid"
    ) {
      edges {
        node {
          id
          name
          email
          phone
          financialStatus
          displayFulfillmentStatus
          totalPriceSet {
            shopMoney {
              amount
            }
          }
          lineItems(first: 50) {
            edges {
              node {
                quantity
                title
                originalUnitPriceSet {
                  shopMoney {
                    amount
                  }
                }
                product {
                  id
                }
              }
            }
          }
          discountApplications(first: 5) {
            edges {
              node {
                ... on DiscountCodeApplication {
                  code
                }
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }`;

  const response = await axios.post(
    SHOPIFY_URL,
    {
      query,
      variables: { cursor }
    },
    {
      headers: {
        "X-Shopify-Access-Token": process.env.SHOPIFY_TOKEN,
        "Content-Type": "application/json"
      }
    }
  );

  return response.data.data.orders;
};