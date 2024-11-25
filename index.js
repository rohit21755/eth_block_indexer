import mongoose from 'mongoose';
import Web3 from 'web3';
import BN from 'bn.js';
mongoose.connect('mongodb://127.0.0.1:27017/test')
  .then(() => console.log('Connected!'))
  .catch((err) => console.log(err));

  const BlockSchema = new mongoose.Schema({
    number: { 
        type: Number, 
        required: true, 
        unique: true,
        index: true 
    },
    hash: { 
        type: String, 
        required: true, 
        unique: true 
    },
    timestamp: { 
        type: Number, 
        required: true 
    },
    gasUsed: { 
        type: String, 
        required: true 
    },
    gasLimit: { 
        type: String, 
        required: true 
    },
    transactions: { 
        type: Number, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});
const TransactionSchema = new mongoose.Schema({
    hash: { 
        type: String, 
        required: true, 
        unique: true,
        index: true 
    },
    blockNumber: { 
        type: Number, 
        required: true,
        index: true 
    },
    from: { 
        type: String, 
        required: true,
        index: true 
    },
    to: { 
        type: String, 
        index: true 
    },
    value: { 
        type: String, 
        required: true 
    },
    gasPrice: { 
        type: String, 
        required: true 
    },
    timestamp: { 
        type: Number, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

const Block = mongoose.model('Block', BlockSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);
const web3 = new Web3("https://eth-sepolia.g.alchemy.com/v2/RFyN7nf_2i2V3FPY87cgn2gBkYw2v0Wc")
let lastProcessedBlock;
async function initialize() {
    const lastBlock = await Block.findOne({}).sort({ number: -1 });
    lastProcessedBlock = lastBlock ? lastBlock.number : parseInt(process.env.START_BLOCK) || 0;
}
async function processBlock(blockNumber) {
    try {
        const block = await web3.eth.getBlock(blockNumber.toString(), true);
        if (!block) return;
        console.log(block)
        const blockDoc = new Block({
            number: Number(block.number),
            hash: block.hash,
            timestamp: Number(block.timestamp), 
            gasUsed: block.gasUsed.toString(), 
            gasLimit: block.gasLimit.toString(),
            transactions: block.transactions.length,
        });

        const transactions = block.transactions.map(tx => ({
            hash: tx.hash,
            from: tx.from.toLowerCase(),
            to: tx.to ? tx.to.toLowerCase() : null,
            value: tx.value.toString(), 
            gasPrice: tx.gasPrice.toString(),
            blockNumber: Number(tx.blockNumber),
            timestamp: Number(block.timestamp), 
        }));
        await blockDoc.save();
        if (transactions.length > 0) {
            await Transaction.insertMany(transactions);
        }

        console.log(`Processed block ${blockNumber} with ${transactions.length} transactions`);
        lastProcessedBlock = blockNumber;
    } catch (error) {
        console.error(`Error processing block ${blockNumber}:`, error);
        throw error;
    }
}
initialize();
processBlock(7147715);