import React, { useState, useEffect } from "react";
import ImageShowcase from "./contracts/ImageShowcase.json";
import getWeb3 from "./getWeb3";
import Nav from "./components/Nav";
import Pagination from "./components/Pagination";
import FormatDate from "./utils/FormatDate";
import Pluralize from "./utils/Pluralize";
import { create } from "ipfs-http-client";
import { Modal, Button } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";

import "./App.css";

const ipfs = create("https://ipfs.infura.io:5001");
const itemsPerPage = 5;

const App = () => {
  const [showModal, setShowModal] = useState(false);
  const [buffer, setBuffer] = useState(null);
  const [imageDescription, setImageDescription] = useState(null);
  const [imageCount, setImageCount] = useState(0);
  const [images, setImages] = useState([]);
  const [web3, setWeb3] = useState(undefined);
  const [accounts, setAccounts] = useState([]);
  const [contract, setContract] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [admin, setAdmin] = useState(false);

  const loadWeb3 = async () => {
    const web3 = await getWeb3();
    setWeb3(web3);
    return web3;
  };

  const loadWeb3Accounts = async (web3) => {
    const accounts = await web3.eth.getAccounts();
    setAccounts(accounts);
  };

  const loadWeb3Contract = async (web3) => {
    const networkId = await web3.eth.net.getId();
    const deployedNetwork = ImageShowcase.networks[networkId];
    const contract = new web3.eth.Contract(
      ImageShowcase.abi,
      deployedNetwork && deployedNetwork.address,
    );
    setContract(contract);
    return contract;
  };

  const captureFile = event => {
    event.preventDefault();
    const file = event.target.files[0];
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = () => {
      setBuffer(Buffer(reader.result));
    }
  };

  const uploadImage = async (description) => {
    const { path } = await ipfs.add(buffer);
    await contract.methods.uploadImage(path, description).send(
      { from: accounts[0] }, (error) => {
        if (!error) {
          setShowModal(!showModal);
          toast.success("Success! Your image should be available when the transaction is completed.");
        } else {
          toast.error(error.message);
        }
      }
    );
  };
  
  const removeImage = async (id) => {
    await contract.methods.removeImage(id).send(
      { from: accounts[0] }, (error) => {
        if (!error) {
          toast.success("Success! The image should be gone when the transaction is completed.");
        } else {
          toast.error(error.message);
        }
      }
    );
  };

  const tipImage = async (id, tipAmount, imageAuthor) => {
    if (imageAuthor === accounts[0]) {
      toast.error("You cannot tip your own image.");
      return;
    }
    await contract.methods.tipImage(id).send(
      { from: accounts[0], value: tipAmount }, (error) => {
        if (!error) {
          toast.success("Success! Tip will be sent when the transaction is completed.");
        } else {
          toast.error(error.message);
        }
      }
    );
  };

  const loadImages = async (contract) => {
    const imagesCount = await contract.methods.imageCount().call();
    let imagesArray = [];
    await Promise.all(
      Array(parseInt(imagesCount))
        .fill()
        .map(async (element, index) => {
          const image = await contract.methods.images(index).call();
          if (image.hash !== "") {
            imagesArray = [...imagesArray, image];
          }
        })
    );
    setImageCount(imagesArray.length);
    setImages(imagesArray);
  };

  const getPaginatedImages = () => {
    const startIndex = currentPage * itemsPerPage - itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return images.slice(startIndex, endIndex);
  };

  const listenForAccountChange = (accounts) => {
    window.ethereum.on("accountsChanged", function (accounts) {
      setAccounts(accounts);
    })
  };

  const checkIfAdmin = async () => {
    const isAdmin = await contract.methods.owner().call();
    setAdmin(isAdmin.toLowerCase() === accounts[0].toLowerCase());
  };

  useEffect(async () => {
    if (accounts.length) {
      checkIfAdmin();
    }
  }, [accounts]);

  useEffect(async () => {
    try {
      const web3 = await loadWeb3();
      const contract = await loadWeb3Contract(web3);
      const accounts = await loadWeb3Accounts(web3);
      await loadImages(contract);
      listenForAccountChange(accounts);
    } catch (error) {
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  }, []);

  if (typeof web3 === "undefined") {
    return <div>Loading Web3, accounts, and contract...</div>;
  } else {
    return (
      <div className="App">
        <Nav account={accounts[0]} />
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick={false}
          rtl={false}
          pauseOnFocusLoss={true}
          draggable={false}
          pauseOnHover={true}
        />
        <div className="container-fluid mt-5">
          <div className="row mt-1">
            <div className="col d-flex flex-column align-items-center">
              <div className="col-10 col-sm-10 col-md-8 col-lg-8 col-xl-6 mb-3 lead text-center">
                <div className="container-fluid d-inline-flex">
                  <Button className="btn btn-primary" onClick={() => setShowModal(!showModal)}>
                    Upload
                  </Button>
                  <Modal show={showModal} onHide={() => setShowModal(!showModal)}>
                    <Modal.Header closeButton>
                      <Modal.Title>Share Image</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const description = imageDescription;
                        uploadImage(description);
                      }}>
                        <input 
                          className="m-2"
                          type="file"
                          accept=".jpg, .jpeg, .png, .bmp, .gif, .webp"
                          onChange={captureFile}
                          required
                        />
                        <div className="form-group mr-sm-2 m-2">
                          <input
                            id="imageDescription"
                            type="text"
                            onChange={(e) => setImageDescription(e.target.value)}
                            className="form-control"
                            placeholder="Image description"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          className="btn btn-primary btn-block btn-lg m-2"
                        >
                          Upload
                        </button>
                      </form>
                    </Modal.Body>
                    <Modal.Footer>
                      <Button
                        variant="secondary"
                        onClick={() => setShowModal(!showModal)}
                      >
                        Close
                      </Button>
                    </Modal.Footer>
                  </Modal>
                </div>
                <div className="container-fluid mt-2">
                  <div className="row">
                    <div className="posts mt-2">
                      {images.length > 0
                        ? getPaginatedImages().map((image, key) => {
                          return image ? (
                            <div className="card mb-4 shadow" key={key} >
                              <div className="card-header">
                                <p className="text-muted mt-3">{image.author}</p>
                              </div>
                              <ul id="imageList" className="list-group list-group-flush">
                                <li className="list-group-item">
                                  <div className="text-center">
                                    <img
                                      className="img-fluid"
                                      src={`https://ipfs.infura.io/ipfs/${image.hash}`}
                                    />
                                  </div>
                                  <p className="mt-3"><b>{image.description}</b></p>
                                  <p className="text-muted">{FormatDate(image.timestamp)}</p>
                                </li>
                                <li key={key} className="list-group-item py-2">
                                  <small className="float-left mt-1 text-muted">
                                    Tips: {web3.utils.fromWei(image.tipAmount.toString(), "Ether")} ETH
                                  </small>
                                  <button
                                    className="btn btn-primary btn-sm float-right p-1 m-2"
                                    name={image.id}
                                    onClick={(event) => {
                                      let tipAmount = web3.utils.toWei("0.1", "Ether");
                                      tipImage(event.target.name, tipAmount, image.author);
                                    }}
                                  >
                                    Tip 0.1 ETH
                                  </button>
                                  {admin ? <button
                                      className="btn btn-danger btn-sm float-right p-1 m-2"
                                      name={image.id}
                                      onClick={(event) => {
                                        removeImage(event.target.name);
                                      }}
                                    >
                                      Remove
                                    </button>
                                    : <></>}
                                </li>
                              </ul>
                            </div>
                          ) : <></>
                        })
                        : <div className="text-center mt-2"><p>No images yet...</p></div>
                      }
                    </div>
                    {images.length ?
                      <div className="d-inline-flex">
                        {Pluralize(imageCount, "image")}
                      </div>
                      : <></>
                    }
                    <div className="d-inline-flex">
                      <Pagination
                        itemsCount={images.length}
                        itemsPerPage={itemsPerPage}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        getPaginatedImages={getPaginatedImages}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default App;