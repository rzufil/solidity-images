// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract ImageShowcase is Ownable, ERC721URIStorage {
  mapping(uint256 => Image) public images;
  uint256 public imageCount;

  struct Image {
    uint256 id;
    string hash;
    string description;
    uint256 tipAmount;
    uint256 timestamp;
    address payable author;
  }

  event ImageCreated(
    uint256 id,
    string hash,
    string description,
    uint256 tipAmount,
    uint256 timestamp,
    address payable author
  );

  event ImageTipped(
    uint256 id,
    uint256 tipAmount,
    uint256 timestamp,
    address payable author
  );

  event ImageRemoved(
    uint256 id,
    uint256 timestamp,
    address author
  );

  constructor() ERC721("ImageShowcase", "DAPP") {}

  function uploadImage(string memory _hash, string memory _description) public {
    require(bytes(_hash).length > 0, "Missing image.");
    require(bytes(_description).length > 0, "Missing description.");
    images[imageCount] = Image(imageCount, _hash, _description, 0, block.timestamp, payable(msg.sender));
    emit ImageCreated(imageCount, _hash, _description, 0, block.timestamp, payable(msg.sender));
    imageCount++;
  }

  function tipImage(uint256 _id) public payable {
    Image memory _image = images[_id];
    require(_image.timestamp > 0, "Invalid image.");
    address payable _author = _image.author;
    payable(_author).transfer(msg.value);
    _image.tipAmount = _image.tipAmount + msg.value;
    images[_id] = _image;
    emit ImageTipped(_id, _image.tipAmount, block.timestamp, _author);
  }

  function removeImage(uint256 _id) public onlyOwner {
    address _author = images[_id].author;
    delete images[_id];
    emit ImageRemoved(_id, block.timestamp, _author);
  }
}