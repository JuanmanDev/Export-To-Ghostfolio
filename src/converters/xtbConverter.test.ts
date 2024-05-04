import { XtbConverter } from "./xtbConverter";
import { SecurityService } from "../securityService";
import { GhostfolioExport } from "../models/ghostfolioExport";

describe("xtbConverter", () => {

  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should construct", () => {

    // Act
    const sut = new XtbConverter(new SecurityService());

    // Assert
    expect(sut).toBeTruthy();
  });

  it("should process sample CSV file", async (done) => {

    // Arange
    const sut = new XtbConverter(new SecurityService());
    const inputFile = "samples/xtb-export.csv";

    // Act
    sut.readAndProcessFile(inputFile, (actualExport: GhostfolioExport) => {

      // Assert
      expect(actualExport).toBeTruthy();
      expect(actualExport.activities.length).toBeGreaterThan(0);
      expect(actualExport.activities.length).toBe(10);

      done();
    }, () => { done.fail("Should not have an error!"); });
  });

  describe("should throw an error if", () => {
    it("the input file does not exist", (done) => {

      // Arrange
      const sut = new XtbConverter(new SecurityService());

      let tempFileName = "tmp/testinput/xtb-filedoesnotexist.csv";

      // Act
      sut.readAndProcessFile(tempFileName, () => { done.fail("Should not succeed!"); }, (err: Error) => {

        // Assert
        expect(err).toBeTruthy();

        done();
      });
    });

    it("the input file is empty", (done) => {

      // Arrange
      const sut = new XtbConverter(new SecurityService());

      let tempFileContent = "";
      tempFileContent += "ID;Type;Time;Symbol;Comment;Amount\n";

      // Act
      sut.processFileContents(tempFileContent, () => { done.fail("Should not succeed!"); }, (err: Error) => {

        // Assert
        expect(err).toBeTruthy();
        expect(err.message).toContain("An error ocurred while parsing");

        done();
      });
    });

    it("Yahoo Finance throws an error", (done) => {

      // Arrange

      let tempFileContent = "";
      tempFileContent += "ID;Type;Time;Symbol;Comment;Amount\n";
      tempFileContent += `513492358;Stocks/ETF purchase;11.03.2024 10:05:05;SPYL.DE;OPEN BUY 8 @ 11.2835;-90.27`;

      // Mock Yahoo Finance service to throw error.
      const securityService = new SecurityService();
      jest.spyOn(securityService, "getSecurity").mockImplementation(() => { throw new Error("Unit test error"); });
      const sut = new XtbConverter(securityService);

      // Act
      sut.processFileContents(tempFileContent, () => { done.fail("Should not succeed!"); }, (err: Error) => {

        // Assert
        expect(err).toBeTruthy();
        expect(err.message).toContain("Unit test error");

        done();
      });
    });
  });

  it("should log when Yahoo Finance returns no symbol", (done) => {

    // Arrange

    let tempFileContent = "";
    tempFileContent += "ID;Type;Time;Symbol;Comment;Amount\n";
    tempFileContent += `513492358;Stocks/ETF purchase;11.03.2024 10:05:05;SPYL.DE;OPEN BUY 8 @ 11.2835;-90.27`;

    // Mock Yahoo Finance service to return null.
    const securityService = new SecurityService();
    jest.spyOn(securityService, "getSecurity").mockImplementation(() => { return null });
    const sut = new XtbConverter(securityService);

    // Bit hacky, but it works.
    const consoleSpy = jest.spyOn((sut as any).progress, "log");

    // Act
    sut.processFileContents(tempFileContent, () => {

      expect(consoleSpy).toHaveBeenCalledWith("[i] No result found for action buy, symbol SPYL.DE and comment OPEN BUY 8 @ 11.2835! Please add this manually..\n");

      done();
    }, () => done.fail("Should not have an error!"));
  });
});
