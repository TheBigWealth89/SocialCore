import app from "./index";
import { globalErrorHandler } from "./middleware/errorHandler";

const PORT = 2011;

app.use(globalErrorHandler);

app.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`)
);
