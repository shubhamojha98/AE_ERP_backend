// import { PrismaClient as Property } from "./generated/property";

// const prop = new Property();

// async function run() {
//   const demands = await prop.tbl_property_demand.findMany({
//     select: {
//       id: true,
//       propertyMaster_id: true,
//     },
//   });

//   for (const d of demands) {
//     const property = await prop.tbl_property_master.findUnique({
//       where: { id: d.propertyMaster_id },
//       select: {
//         ulb_id: true,
//         zone_id: true,
//         ward_id: true,
//       },
//     });

//     if (property) {
//       await prop.tbl_property_demand.update({
//         where: { id: d.id },
//         data: {
//           ulb_id: property.ulb_id,
//           zone_id: property.zone_id,
//           ward_id: property.ward_id,
//         },
//       });
//     }
//   }
// }

// run()
//   .then(() => {
//     console.log(" Done");
//   })
//   .catch((e) => {
//     console.error(e);
//   })
//   .finally(async () => {
//     await prop.$disconnect();
//   });