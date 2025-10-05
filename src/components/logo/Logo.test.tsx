import {screen} from "@testing-library/react";
import {render} from "@tests/TestRenderer";

import Logo from "./Logo";

describe("Logo component", () => {
    test("renders properly", async () => {
        await render(<Logo data-testid="logo" />);

        expect(screen.getByTestId("logo")).toBeInTheDocument();
    });
});
