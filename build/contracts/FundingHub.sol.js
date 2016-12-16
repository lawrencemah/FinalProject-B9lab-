var Web3 = require("web3");
var SolidityEvent = require("web3/lib/web3/event.js");

(function() {
  // Planned for future features, logging, etc.
  function Provider(provider) {
    this.provider = provider;
  }

  Provider.prototype.send = function() {
    this.provider.send.apply(this.provider, arguments);
  };

  Provider.prototype.sendAsync = function() {
    this.provider.sendAsync.apply(this.provider, arguments);
  };

  var BigNumber = (new Web3()).toBigNumber(0).constructor;

  var Utils = {
    is_object: function(val) {
      return typeof val == "object" && !Array.isArray(val);
    },
    is_big_number: function(val) {
      if (typeof val != "object") return false;

      // Instanceof won't work because we have multiple versions of Web3.
      try {
        new BigNumber(val);
        return true;
      } catch (e) {
        return false;
      }
    },
    merge: function() {
      var merged = {};
      var args = Array.prototype.slice.call(arguments);

      for (var i = 0; i < args.length; i++) {
        var object = args[i];
        var keys = Object.keys(object);
        for (var j = 0; j < keys.length; j++) {
          var key = keys[j];
          var value = object[key];
          merged[key] = value;
        }
      }

      return merged;
    },
    promisifyFunction: function(fn, C) {
      var self = this;
      return function() {
        var instance = this;

        var args = Array.prototype.slice.call(arguments);
        var tx_params = {};
        var last_arg = args[args.length - 1];

        // It's only tx_params if it's an object and not a BigNumber.
        if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
          tx_params = args.pop();
        }

        tx_params = Utils.merge(C.class_defaults, tx_params);

        return new Promise(function(accept, reject) {
          var callback = function(error, result) {
            if (error != null) {
              reject(error);
            } else {
              accept(result);
            }
          };
          args.push(tx_params, callback);
          fn.apply(instance.contract, args);
        });
      };
    },
    synchronizeFunction: function(fn, instance, C) {
      var self = this;
      return function() {
        var args = Array.prototype.slice.call(arguments);
        var tx_params = {};
        var last_arg = args[args.length - 1];

        // It's only tx_params if it's an object and not a BigNumber.
        if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
          tx_params = args.pop();
        }

        tx_params = Utils.merge(C.class_defaults, tx_params);

        return new Promise(function(accept, reject) {

          var decodeLogs = function(logs) {
            return logs.map(function(log) {
              var logABI = C.events[log.topics[0]];

              if (logABI == null) {
                return null;
              }

              var decoder = new SolidityEvent(null, logABI, instance.address);
              return decoder.decode(log);
            }).filter(function(log) {
              return log != null;
            });
          };

          var callback = function(error, tx) {
            if (error != null) {
              reject(error);
              return;
            }

            var timeout = C.synchronization_timeout || 240000;
            var start = new Date().getTime();

            var make_attempt = function() {
              C.web3.eth.getTransactionReceipt(tx, function(err, receipt) {
                if (err) return reject(err);

                if (receipt != null) {
                  // If they've opted into next gen, return more information.
                  if (C.next_gen == true) {
                    return accept({
                      tx: tx,
                      receipt: receipt,
                      logs: decodeLogs(receipt.logs)
                    });
                  } else {
                    return accept(tx);
                  }
                }

                if (timeout > 0 && new Date().getTime() - start > timeout) {
                  return reject(new Error("Transaction " + tx + " wasn't processed in " + (timeout / 1000) + " seconds!"));
                }

                setTimeout(make_attempt, 1000);
              });
            };

            make_attempt();
          };

          args.push(tx_params, callback);
          fn.apply(self, args);
        });
      };
    }
  };

  function instantiate(instance, contract) {
    instance.contract = contract;
    var constructor = instance.constructor;

    // Provision our functions.
    for (var i = 0; i < instance.abi.length; i++) {
      var item = instance.abi[i];
      if (item.type == "function") {
        if (item.constant == true) {
          instance[item.name] = Utils.promisifyFunction(contract[item.name], constructor);
        } else {
          instance[item.name] = Utils.synchronizeFunction(contract[item.name], instance, constructor);
        }

        instance[item.name].call = Utils.promisifyFunction(contract[item.name].call, constructor);
        instance[item.name].sendTransaction = Utils.promisifyFunction(contract[item.name].sendTransaction, constructor);
        instance[item.name].request = contract[item.name].request;
        instance[item.name].estimateGas = Utils.promisifyFunction(contract[item.name].estimateGas, constructor);
      }

      if (item.type == "event") {
        instance[item.name] = contract[item.name];
      }
    }

    instance.allEvents = contract.allEvents;
    instance.address = contract.address;
    instance.transactionHash = contract.transactionHash;
  };

  // Use inheritance to create a clone of this contract,
  // and copy over contract's static functions.
  function mutate(fn) {
    var temp = function Clone() { return fn.apply(this, arguments); };

    Object.keys(fn).forEach(function(key) {
      temp[key] = fn[key];
    });

    temp.prototype = Object.create(fn.prototype);
    bootstrap(temp);
    return temp;
  };

  function bootstrap(fn) {
    fn.web3 = new Web3();
    fn.class_defaults  = fn.prototype.defaults || {};

    // Set the network iniitally to make default data available and re-use code.
    // Then remove the saved network id so the network will be auto-detected on first use.
    fn.setNetwork("default");
    fn.network_id = null;
    return fn;
  };

  // Accepts a contract object created with web3.eth.contract.
  // Optionally, if called without `new`, accepts a network_id and will
  // create a new version of the contract abstraction with that network_id set.
  function Contract() {
    if (this instanceof Contract) {
      instantiate(this, arguments[0]);
    } else {
      var C = mutate(Contract);
      var network_id = arguments.length > 0 ? arguments[0] : "default";
      C.setNetwork(network_id);
      return C;
    }
  };

  Contract.currentProvider = null;

  Contract.setProvider = function(provider) {
    var wrapped = new Provider(provider);
    this.web3.setProvider(wrapped);
    this.currentProvider = provider;
  };

  Contract.new = function() {
    if (this.currentProvider == null) {
      throw new Error("FundingHub error: Please call setProvider() first before calling new().");
    }

    var args = Array.prototype.slice.call(arguments);

    if (!this.unlinked_binary) {
      throw new Error("FundingHub error: contract binary not set. Can't deploy new instance.");
    }

    var regex = /__[^_]+_+/g;
    var unlinked_libraries = this.binary.match(regex);

    if (unlinked_libraries != null) {
      unlinked_libraries = unlinked_libraries.map(function(name) {
        // Remove underscores
        return name.replace(/_/g, "");
      }).sort().filter(function(name, index, arr) {
        // Remove duplicates
        if (index + 1 >= arr.length) {
          return true;
        }

        return name != arr[index + 1];
      }).join(", ");

      throw new Error("FundingHub contains unresolved libraries. You must deploy and link the following libraries before you can deploy a new version of FundingHub: " + unlinked_libraries);
    }

    var self = this;

    return new Promise(function(accept, reject) {
      var contract_class = self.web3.eth.contract(self.abi);
      var tx_params = {};
      var last_arg = args[args.length - 1];

      // It's only tx_params if it's an object and not a BigNumber.
      if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
        tx_params = args.pop();
      }

      tx_params = Utils.merge(self.class_defaults, tx_params);

      if (tx_params.data == null) {
        tx_params.data = self.binary;
      }

      // web3 0.9.0 and above calls new twice this callback twice.
      // Why, I have no idea...
      var intermediary = function(err, web3_instance) {
        if (err != null) {
          reject(err);
          return;
        }

        if (err == null && web3_instance != null && web3_instance.address != null) {
          accept(new self(web3_instance));
        }
      };

      args.push(tx_params, intermediary);
      contract_class.new.apply(contract_class, args);
    });
  };

  Contract.at = function(address) {
    if (address == null || typeof address != "string" || address.length != 42) {
      throw new Error("Invalid address passed to FundingHub.at(): " + address);
    }

    var contract_class = this.web3.eth.contract(this.abi);
    var contract = contract_class.at(address);

    return new this(contract);
  };

  Contract.deployed = function() {
    if (!this.address) {
      throw new Error("Cannot find deployed address: FundingHub not deployed or address not set.");
    }

    return this.at(this.address);
  };

  Contract.defaults = function(class_defaults) {
    if (this.class_defaults == null) {
      this.class_defaults = {};
    }

    if (class_defaults == null) {
      class_defaults = {};
    }

    var self = this;
    Object.keys(class_defaults).forEach(function(key) {
      var value = class_defaults[key];
      self.class_defaults[key] = value;
    });

    return this.class_defaults;
  };

  Contract.extend = function() {
    var args = Array.prototype.slice.call(arguments);

    for (var i = 0; i < arguments.length; i++) {
      var object = arguments[i];
      var keys = Object.keys(object);
      for (var j = 0; j < keys.length; j++) {
        var key = keys[j];
        var value = object[key];
        this.prototype[key] = value;
      }
    }
  };

  Contract.all_networks = {
  "default": {
    "abi": [
      {
        "constant": false,
        "inputs": [],
        "name": "gettime",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "deadline",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "statusid",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_project_name",
            "type": "bytes32"
          },
          {
            "name": "_target",
            "type": "uint256"
          },
          {
            "name": "_deadline",
            "type": "uint256"
          }
        ],
        "name": "CreateProject",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "refund",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "v",
            "type": "uint256"
          }
        ],
        "name": "getlist",
        "outputs": [
          {
            "name": "",
            "type": "bytes32"
          },
          {
            "name": "",
            "type": "address"
          },
          {
            "name": "",
            "type": "uint256"
          },
          {
            "name": "",
            "type": "uint256"
          },
          {
            "name": "",
            "type": "uint256"
          },
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_msg",
            "type": "address"
          },
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "name": "fund",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "getnopro",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_project",
            "type": "address"
          },
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "name": "contribute",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "id",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "contractadd",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "target",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "project_name",
        "outputs": [
          {
            "name": "",
            "type": "bytes32"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_owner",
            "type": "address"
          },
          {
            "name": "_project_name",
            "type": "bytes32"
          },
          {
            "name": "_deadline",
            "type": "uint256"
          },
          {
            "name": "_target",
            "type": "uint256"
          },
          {
            "name": "_id",
            "type": "uint256"
          }
        ],
        "name": "pass",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "idcall",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "payable": true,
        "type": "fallback"
      }
    ],
    "unlinked_binary": "0x6060604052600060085530600160a060020a0316316009556000600b555b5b5b610cf98061002d6000396000f3606060405236156100c45760e060020a600035046316d061a581146100cd57806329dcb0cf146100ec57806345046b8f1461010b57806356892dc61461012a578063590e1ae3146101425780636c9958e0146101515780637b1837de1461019c5780637daea8eb146101b15780638418cd99146101d05780638da5cb5b146101e5578063af640d0f1461020e578063afbb49321461022d578063d4b8399214610256578063dc9c9f3314610275578063de054b2b14610294578063f27a6e0a146102b2575b6100cb5b5b565b005b34610000576100da6102d1565b60408051918252519081900360200190f35b34610000576100da6102d6565b60408051918252519081900360200190f35b34610000576100da6102dc565b60408051918252519081900360200190f35b34610000576100cb6004356024356044356102e2565b005b34610000576100cb610409565b005b3461000057610161600435610465565b60408051968752600160a060020a039095166020870152858501939093526060850191909152608084015260a0830152519081900360c00190f35b34610000576100cb6004356024356106dd565b005b34610000576100da6107db565b60408051918252519081900360200190f35b34610000576100cb6004356024356107e2565b005b34610000576101f2610847565b60408051600160a060020a039092168252519081900360200190f35b34610000576100da610856565b60408051918252519081900360200190f35b34610000576101f261085c565b60408051600160a060020a039092168252519081900360200190f35b34610000576100da61086b565b60408051918252519081900360200190f35b34610000576100da610871565b60408051918252519081900360200190f35b34610000576100cb600435602435604435606435608435610877565b005b34610000576100da6108d7565b60408051918252519081900360200190f35b425b90565b60035481565b60055481565b6000600060405161041b806108de833960405191018190039082f08015610000579050905080600160a060020a031663de054b2b33868587600b546040518660e060020a0281526004018086600160a060020a031681526020018560001916815260200184815260200183815260200182815260200195505050505050600060405180830381600087803b156100005760325a03f11561000057505050600a80548060010182818154818355818115116103c1576000838152602090206103c19181019083015b808211156103bd57600081556001016103a9565b5090565b5b505050916000526020600020900160005b8154606060020a808602046101009290920a918202600160a060020a03909202191617905550600b805460010190555b50505050565b6000805b60085482116104605760008281526007602052604080822060018101546002909101549151600160a060020a039091169282156108fc02929190818181858888f1600190960195945061040d9350505050565b5b5050565b600060006000600060006000600a87815481101561000057906000526020600020900160005b9054906101000a9004600160a060020a0316600160a060020a031663dc9c9f336000604051602001526040518160e060020a028152600401809050602060405180830381600087803b156100005760325a03f11561000057505060405151600a805491925090899081101561000057906000526020600020900160005b9054906101000a9004600160a060020a0316600a89815481101561000057906000526020600020900160005b9054906101000a9004600160a060020a0316600160a060020a031631600a8a815481101561000057906000526020600020900160005b9054906101000a9004600160a060020a0316600160a060020a031663d4b839926000604051602001526040518160e060020a028152600401809050602060405180830381600087803b156100005760325a03f11561000057505060405151600a8054919250908c9081101561000057906000526020600020900160005b9054906101000a9004600160a060020a0316600160a060020a03166329dcb0cf6000604051602001526040518160e060020a028152600401809050602060405180830381600087803b156100005760325a03f11561000057505060405151600a8054919250908d9081101561000057906000526020600020900160005b9054906101000a9004600160a060020a0316600160a060020a03166345046b8f6000604051602001526040518160e060020a028152600401809050602060405180830381600087803b156100005760325a03f11561000057505060405151959b5093995091975095509350909150505b91939550919395565b600880546000818152600760205260408082209283556001909201805473ffffffffffffffffffffffffffffffffffffffff1916606060020a8781020417905591548252812060020182905560046005556003548190819042111561074e57610744610409565b60026005556107c9565b600254600160a060020a03301631106107c9576003600555600254604051600160a060020a03308116319290920394509086169084156108fc029085906000818181858888f160008054604051929850600160a060020a03908116965030163180156108fc0295509350909150818181858888f19450505050505b5b6008805460010190555b5050505050565b600b545b90565b600082905080600160a060020a0316637b1837de33846040518360e060020a0281526004018083600160a060020a0316815260200182815260200192505050600060405180830381600087803b156100005760325a03f115610000575050505b505050565b600054600160a060020a031681565b60045481565b600654600160a060020a031681565b60025481565b60015481565b600282905560008054606060020a80880281900473ffffffffffffffffffffffffffffffffffffffff19928316179092556001868155600680543085029490940493909216929092179055600384905560048290556005555b5050505050565b6004545b90566060604052600060085530600160a060020a0316316009555b5b5b6103f3806100286000396000f36060604052361561008d5760e060020a600035046329dcb0cf811461009657806345046b8f146100b5578063590e1ae3146100d45780637b1837de146100e35780638da5cb5b146100f8578063af640d0f14610121578063afbb493214610140578063d4b8399214610169578063dc9c9f3314610188578063de054b2b146101a7578063f27a6e0a146101c5575b6100945b5b565b005b34610000576100a36101e4565b60408051918252519081900360200190f35b34610000576100a36101ea565b60408051918252519081900360200190f35b34610000576100946101f0565b005b346100005761009460043560243561024c565b005b3461000057610105610353565b60408051600160a060020a039092168252519081900360200190f35b34610000576100a3610362565b60408051918252519081900360200190f35b3461000057610105610368565b60408051600160a060020a039092168252519081900360200190f35b34610000576100a3610377565b60408051918252519081900360200190f35b34610000576100a361037d565b60408051918252519081900360200190f35b3461000057610094600435602435604435606435608435610383565b005b34610000576100a36103ec565b60408051918252519081900360200190f35b60035481565b60055481565b6000805b60085482116102475760008281526007602052604080822060018101546002909101549151600160a060020a039091169282156108fc02929190818181858888f160019096019594506101f49350505050565b5b5050565b600880546000818152600760205260408082209283556001909201805473ffffffffffffffffffffffffffffffffffffffff19166c01000000000000000000000000878102041790559154825281206002018290556004600555600354819081904211156102c6576102bc6101f0565b6002600555610341565b600254600160a060020a0330163110610341576003600555600254604051600160a060020a03308116319290920394509086169084156108fc029085906000818181858888f160008054604051929850600160a060020a03908116965030163180156108fc0295509350909150818181858888f19450505050505b5b6008805460010190555b5050505050565b600054600160a060020a031681565b60045481565b600654600160a060020a031681565b60025481565b60015481565b6002829055600080546c0100000000000000000000000080880281900473ffffffffffffffffffffffffffffffffffffffff19928316179092556001868155600680543085029490940493909216929092179055600384905560048290556005555b5050505050565b6004545b9056",
    "events": {},
    "updated_at": 1481778577418,
    "links": {},
    "address": "0x30f36d0ec2b5254e00521b418d198559bfa41520"
  }
};

  Contract.checkNetwork = function(callback) {
    var self = this;

    if (this.network_id != null) {
      return callback();
    }

    this.web3.version.network(function(err, result) {
      if (err) return callback(err);

      var network_id = result.toString();

      // If we have the main network,
      if (network_id == "1") {
        var possible_ids = ["1", "live", "default"];

        for (var i = 0; i < possible_ids.length; i++) {
          var id = possible_ids[i];
          if (Contract.all_networks[id] != null) {
            network_id = id;
            break;
          }
        }
      }

      if (self.all_networks[network_id] == null) {
        return callback(new Error(self.name + " error: Can't find artifacts for network id '" + network_id + "'"));
      }

      self.setNetwork(network_id);
      callback();
    })
  };

  Contract.setNetwork = function(network_id) {
    var network = this.all_networks[network_id] || {};

    this.abi             = this.prototype.abi             = network.abi;
    this.unlinked_binary = this.prototype.unlinked_binary = network.unlinked_binary;
    this.address         = this.prototype.address         = network.address;
    this.updated_at      = this.prototype.updated_at      = network.updated_at;
    this.links           = this.prototype.links           = network.links || {};
    this.events          = this.prototype.events          = network.events || {};

    this.network_id = network_id;
  };

  Contract.networks = function() {
    return Object.keys(this.all_networks);
  };

  Contract.link = function(name, address) {
    if (typeof name == "function") {
      var contract = name;

      if (contract.address == null) {
        throw new Error("Cannot link contract without an address.");
      }

      Contract.link(contract.contract_name, contract.address);

      // Merge events so this contract knows about library's events
      Object.keys(contract.events).forEach(function(topic) {
        Contract.events[topic] = contract.events[topic];
      });

      return;
    }

    if (typeof name == "object") {
      var obj = name;
      Object.keys(obj).forEach(function(name) {
        var a = obj[name];
        Contract.link(name, a);
      });
      return;
    }

    Contract.links[name] = address;
  };

  Contract.contract_name   = Contract.prototype.contract_name   = "FundingHub";
  Contract.generated_with  = Contract.prototype.generated_with  = "3.2.0";

  // Allow people to opt-in to breaking changes now.
  Contract.next_gen = false;

  var properties = {
    binary: function() {
      var binary = Contract.unlinked_binary;

      Object.keys(Contract.links).forEach(function(library_name) {
        var library_address = Contract.links[library_name];
        var regex = new RegExp("__" + library_name + "_*", "g");

        binary = binary.replace(regex, library_address.replace("0x", ""));
      });

      return binary;
    }
  };

  Object.keys(properties).forEach(function(key) {
    var getter = properties[key];

    var definition = {};
    definition.enumerable = true;
    definition.configurable = false;
    definition.get = getter;

    Object.defineProperty(Contract, key, definition);
    Object.defineProperty(Contract.prototype, key, definition);
  });

  bootstrap(Contract);

  if (typeof module != "undefined" && typeof module.exports != "undefined") {
    module.exports = Contract;
  } else {
    // There will only be one version of this contract in the browser,
    // and we can use that.
    window.FundingHub = Contract;
  }
})();
