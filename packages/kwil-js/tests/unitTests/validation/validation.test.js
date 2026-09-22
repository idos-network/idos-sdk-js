const kwiljs = require('../../../dist/index');
const ethers = require('ethers');

require('dotenv').config();

describe('Kwil Parameter Validation Tests', () => {
  const provider = new ethers.JsonRpcProvider(process.env.ETH_PROVIDER); // provider
  // Use a fallback private key if env var is not set, and ensure it has 0x prefix
  const privateKey = process.env.PRIVATE_KEY || '0000000000000000000000000000000000000000000000000000000000000001';
  const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  const wallet = new ethers.Wallet(formattedPrivateKey, provider); // signer
  const address = wallet.address; // address

  const kwil = new kwiljs.NodeKwil({
    kwilProvider: process.env.KWIL_PROVIDER || 'SHOULD FAIL',
    chainId: '',
    timeout: 10000,
    logging: true,
  });

  it('should return a validation error if the identifier/address is null or undefined', async () => {
    const kwil = new kwiljs.NodeKwil({
      kwilProvider: process.env.KWIL_PROVIDER || 'SHOULD FAIL',
      chainId: '',
      timeout: 10000,
      logging: true,
    });

    // PROVIDE WALLET/SIGNER BUT NO ADDRESS/IDENTIFIER
    const kSigner = new kwiljs.KwilSigner(wallet);

    const dbid = kwil.getDBID(address, 'social');

    const body = {
      dbid: dbid,
      description: 'drop this db',
    };

    await expect(kwil.drop(body, kSigner, true)).rejects.toThrowError();
  });

  it('should return a validation error if the chain id is null or undefined', async () => {
    // NO PROVIDER PROVIDED
    const kwilNoChainId = new kwiljs.NodeKwil({
      kwilProvider: process.env.KWIL_PROVIDER || 'SHOULD FAIL',
      timeout: 10000,
      logging: true,
    });

    const kSigner = new kwiljs.KwilSigner(wallet, address);

    const dbid = kwilNoChainId.getDBID(address, 'social');

    const body = {
      dbid: dbid,
      description: 'drop this db',
    };

    await expect(kwilNoChainId.drop(body, kSigner, true)).rejects.toThrowError();
  });

  it('should return a validation error if the dbid is null or undefined when performing an action', async () => {
    const kwil = new kwiljs.NodeKwil({
      kwilProvider: process.env.KWIL_PROVIDER || 'SHOULD FAIL',
      chainId: '',
      timeout: 10000,
      logging: true,
    });

    const kSigner = new kwiljs.KwilSigner(wallet, address);

    const actionBody = {
      // NO DBID PROVIDED
      name: 'add_post',
      inputs: [
        {
          $user: 'Ty',
          $title: 'Test Post',
          $body: 'This is a test post',
        },
      ],
      description: 'This is a test action',
    };

    await expect(kwil.execute(actionBody, kSigner)).rejects.toThrowError();
  });

  it('should return a validation error if the actionName is null or undefined when performing an action', async () => {
    const kwil = new kwiljs.NodeKwil({
      kwilProvider: process.env.KWIL_PROVIDER || 'SHOULD FAIL',
      chainId: '',
      timeout: 10000,
      logging: true,
    });

    const kSigner = new kwiljs.KwilSigner(wallet, address);

    const dbid = kwil.getDBID(address, 'social');

    const actionBody = {
      dbid,
      // NO ACTION NAME PROVIDED
      inputs: [
        {
          $id: 3,
          $title: 'tampa',
          $content: 'l cool',
          $date_string: '11-22-2024',
        },
      ],
    };

    await expect(kwil.execute(actionBody, kSigner)).rejects.toThrowError();
  });
});
