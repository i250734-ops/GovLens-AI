import { getOpportunities } from "./index";

getOpportunities({
  naicsCode: "541512",
  postedFrom: "01/01/2026",
  postedTo: "01/31/2026",
  limit: 5,
})
  .then((data) => console.log(JSON.stringify(data, null, 2)))
  .catch((err) => console.error("ERROR:", err));
