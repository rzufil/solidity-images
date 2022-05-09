const ImageShowcase = artifacts.require("./ImageShowcase.sol");

require("chai")
  .use(require("chai-as-promised"))
  .should();

contract("ImageShowcase", ([deployer, author, tipper]) => {
  let ImageShowcaseInstance;

  before(async () => {
    ImageShowcaseInstance = await ImageShowcase.deployed();
  });

  describe("deployment", async () => {
    it("...should deploy successfully.", async () => {
      const address = await ImageShowcaseInstance.address;
      assert.notEqual(address, 0x0);
      assert.notEqual(address, "");
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);
    });
  });

  describe("image upload", async () => {
    let result, imageCount;
    const hash = "hash123";
    const imageDescription = "Image description";

    before(async () => {
      result = await ImageShowcaseInstance.uploadImage(hash, imageDescription, { from: author });
      imageCount = await ImageShowcaseInstance.imageCount();
    });

    it("...should upload an image.", async () => {
      const event = result.logs[0].args;
      assert.equal(imageCount, 1);
      assert.equal(event.id.toNumber(), imageCount.toNumber() - 1);
      assert.equal(event.hash, hash);
      assert.equal(event.description, imageDescription);
      assert.equal(event.tipAmount.toNumber(), 0);
      assert.equal(event.author, author);
    });

    it("...should not upload an image.", async () => {
      await ImageShowcaseInstance.uploadImage("", imageDescription, { from: author }).should.be.rejected;
    });

    it("...should list an image", async () => {
      const image = await ImageShowcaseInstance.images(imageCount.toNumber() - 1);
      assert.equal(image.id.toNumber(), imageCount.toNumber() - 1);
      assert.equal(image.hash, hash);
      assert.equal(image.description, imageDescription);
      assert.equal(image.tipAmount, "0");
      assert.equal(image.author, author);
    });
    
    it("...should tip an image", async () => {
      let oldBalance;
      oldBalance = await web3.eth.getBalance(author);
      oldBalance = new web3.utils.BN(oldBalance);
      result = await ImageShowcaseInstance.tipImage(imageCount - 1, { from: tipper, value: web3.utils.toWei("1", "Ether") });
      const event = result.logs[0].args;
      assert.equal(event.id.toNumber(), imageCount.toNumber() - 1);
      assert.equal(event.tipAmount, "1000000000000000000");
      assert.equal(event.author, author);

      let newBalance;
      newBalance = await web3.eth.getBalance(author);
      newBalance = new web3.utils.BN(newBalance);
      let tipImage;
      tipImage = web3.utils.toWei("1", "Ether");
      tipImage = new web3.utils.BN(tipImage);
      const expectedBalance = oldBalance.add(tipImage);
      assert.equal(newBalance.toString(), expectedBalance.toString());
    });
    
    it("...should not tip an image", async () => {
      await ImageShowcaseInstance.tipImage(imageCount, { from: tipper, value: web3.utils.toWei("1", "Ether")}).should.be.rejected;
    });

    it("...should remove an image", async () => {
      result = await ImageShowcaseInstance.removeImage(imageCount - 1, { from: deployer });
      const event = result.logs[0].args;
      assert.equal(event.id.toNumber(), imageCount.toNumber() - 1);
      assert.equal(event.author, author);
      const image = await ImageShowcaseInstance.images(imageCount.toNumber() - 1);
      assert.notEqual(image.hash, hash);
      assert.notEqual(image.description, imageDescription);
      assert.notEqual(image.author, author);
    });
  });
});