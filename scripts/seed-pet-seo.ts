import { bootstrapPetSeoProgram } from "../lib/pet-seo/bootstrap";

bootstrapPetSeoProgram()
  .then((result) => {
    console.log(JSON.stringify({ ok: true, ...result }, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

