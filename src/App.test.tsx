
import {screen} from "@testing-library/react";
import {render} from "@tests/TestRenderer";

import App from "./App";

describe("App component", () => {

    test("renders properly", async () => {
        await render(<App data-testid="app" />);
       
        expect(screen.getByTestId("app")).toBeInTheDocument();
    });

});
