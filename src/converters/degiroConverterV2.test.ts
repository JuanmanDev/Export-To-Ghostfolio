import { DeGiroConverterV2 } from "./degiroConverterV2";

describe("degiroConverterV2", () => {

    it("should construct", () => {

      // Act
      const sut = new DeGiroConverterV2();

      // Asssert
      expect(sut).toBeTruthy();
    });
});
