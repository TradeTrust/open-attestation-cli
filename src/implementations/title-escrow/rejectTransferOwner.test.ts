import { TitleEscrow__factory, TradeTrustToken__factory } from "@tradetrust-tt/token-registry/contracts";
import { Wallet } from "ethers";

import { BaseTitleEscrowCommand as TitleEscrowRejectTransferCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { rejectTransferOwner } from "./rejectTransferOwner";

jest.mock("@tradetrust-tt/token-registry/contracts");

const transferOwnerParams: TitleEscrowRejectTransferCommand = {
  remark: "0xabcd",
  encryptionKey: "0x1234",
  tokenId: "0xzyxw",
  tokenRegistry: "0x1234",
  network: "sepolia",
  maxPriorityFeePerGasScale: 1,
  dryRun: false,
};

describe("title-escrow", () => {
  describe("reject Owner of transferable record", () => {
    const mockedTradeTrustTokenFactory: jest.Mock<TradeTrustToken__factory> = TradeTrustToken__factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectERC721: jest.Mock = mockedTradeTrustTokenFactory.connect;

    const mockedTokenFactory: jest.Mock<TitleEscrow__factory> = TitleEscrow__factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectTokenFactory: jest.Mock = mockedTokenFactory.connect;
    const mockedOwnerOf = jest.fn();
    const mockRejectTransferOwner = jest.fn();
    const mockCallStaticRejectTransferOwner = jest.fn().mockResolvedValue(undefined);
    const mockedTitleEscrowAddress = "0x2133";
    mockedOwnerOf.mockReturnValue(mockedTitleEscrowAddress);
    mockRejectTransferOwner.mockReturnValue({
      hash: "hash",
      wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
    });

    const mockedPrevBeneficiary = "0xdssfs";
    const mockGetPrevBeneficiary = jest.fn();
    mockGetPrevBeneficiary.mockReturnValue(mockedPrevBeneficiary);

    mockedConnectERC721.mockReturnValue({
      ownerOf: mockedOwnerOf,
    });
    mockedConnectTokenFactory.mockReturnValue({
      prevBeneficiary: mockGetPrevBeneficiary,
      rejectTransferBeneficiary: mockRejectTransferOwner,
      callStatic: {
        rejectTransferBeneficiary: mockCallStaticRejectTransferOwner,
      },
    });

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedTradeTrustTokenFactory.mockClear();
      mockedConnectERC721.mockClear();
      mockedTokenFactory.mockClear();
      mockedConnectTokenFactory.mockClear();
      mockedOwnerOf.mockClear();
      mockRejectTransferOwner.mockClear();
      mockCallStaticRejectTransferOwner.mockClear();
    });

    it("should pass in the correct params and call the following procedures to invoke a reject owner of a transferable record", async () => {
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      await rejectTransferOwner({
        ...transferOwnerParams,
        key: privateKey,
      });

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${privateKey}`);
      expect(mockedConnectERC721).toHaveBeenCalledWith(transferOwnerParams.tokenRegistry, passedSigner);
      expect(mockedOwnerOf).toHaveBeenCalledWith(transferOwnerParams.tokenId);
      expect(mockedConnectTokenFactory).toHaveBeenCalledWith(mockedTitleEscrowAddress, passedSigner);
      expect(mockCallStaticRejectTransferOwner).toHaveBeenCalledTimes(1);
      expect(mockRejectTransferOwner).toHaveBeenCalledTimes(1);
    });
  });
});
