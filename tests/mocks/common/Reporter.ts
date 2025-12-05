
const reporterStartMock = jest.fn();
const reporterFinishMock = jest.fn();

const ReporterInstanceMock = () => ({
    start: reporterStartMock,
    finish: reporterFinishMock,
});

// jest.mock("../common/Reporter", () => ({
//     __esModule: true,
//     Reporter: function (...args: unknown[]) {
//         return ReporterMock(...args);
//     },
// }));

export const Reporter = jest.fn().mockImplementation(ReporterInstanceMock);

export const ReporterMock = {
    Reporter
};

export default ReporterMock;
