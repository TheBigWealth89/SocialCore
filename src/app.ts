import app from "./index";
import connectDB from "./lib/db";
const PORT = 2001;

connectDB();

app.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`)
);
