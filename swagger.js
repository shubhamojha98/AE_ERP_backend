import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "My API",
    description: "Description",
  },
  host: "localhost:6971",
};

const outputFile = "./swagger-output.json";
const routes = [
  // "./route/panel/panel.route.ts",
  // "./route/auth/auth.route.ts",
  // "./route/property/newAssessment.route.ts",
  // "./route/property/re-Assessment.route.ts",
  // "./route/waste/waste.route.ts",
  // "./route/water/water.route.ts",
  "./route/shop/shop.route.ts",
  "./route/trade/trade.route.ts",
];

/* NOTE: If you are using the express Router, you must pass in the 'routes' only the 
root file where the route starts, such as index.js, app.js, routes.js, etc ... */

swaggerAutogen(outputFile, routes, doc);
