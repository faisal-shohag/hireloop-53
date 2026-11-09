import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { MongoClient, ObjectId } from 'mongodb';
import Stripe from 'stripe';
import { requireSeeker } from './lib/seeker-auth.js';
import { createPaymentService, createPaymentRouter } from './lib/payments.js';
import { createApplicationService } from './lib/applications.js';
import { errorHandler } from './lib/http-error.js';

const app = express();
const port = process.env.PORT || 5000;
const clientUrl = new URL(process.env.CLIENT_URL || 'http://localhost:3000').origin;

// middleware
app.use(express.json());
app.use(cors({ origin: clientUrl, credentials: true }));

const client = new MongoClient(process.env.MONGO_DB_URI);

export async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("You successfully connected to MongoDB!");
        return client;
    } catch (err) {
        console.dir(err);
    }
}

const connectedClient = await connectToMongoDB();
const database = connectedClient.db("hireloopdb");
const users = database.collection("user");
const jobs = database.collection("jobs");
const applications = database.collection("applications");
// await database.collection('transactions').createIndex({ sessionId: 1 }, { unique: true });
// await applications.createIndex({ userId: 1, appliedAt: 1 });
// Pin the API contract used by this card-only, return-page verification flow.
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-10-28.endive', timeout: 10000, maxNetworkRetries: 1 }) : null;
const authenticate = requireSeeker({ users, clientUrl });
const payments = createPaymentService({ stripe, client, database, priceId: process.env.PRODUCT_ID, clientUrl });
const submitApplication = createApplicationService({ client, database, payments });
app.use(createPaymentRouter({ payments, authenticate }));

app.get('/', (req, res) => {
    res.send('hire loop is looping')
})


app.get('/users', async (req, res) => {
    const cursor = users.find({});
    const result = await cursor.toArray();
    res.send(result);
})


// jobs related apis
app.get('/jobs', async (req, res) => {

    const query = {};
    // console.log('query', req.query);
    if (req.query) {
        if (req.query.jobType) {
            query.jobType = req.query.jobType;
        }
        if (req.query.isRemote) {
            query.isRemote = req.query.isRemote === 'true';
        }
        if (req.query.category) {
            query.category = req.query.category;
        }
        if (req.query.search) {
            query.$or = [
                { title: { $regex: req.query.search, $options: 'i' } },
                { company: { $regex: req.query.search, $options: 'i' } },
                { responsibilities: { $regex: req.query.search, $options: 'i' } },
                { requirements: { $regex: req.query.search, $options: 'i' } }
            ];
        }
    }

    const cursor = jobs.find({});

    const result = await cursor.toArray();
    // console.log(result)
    res.send(result);
})

app.get(`/jobs/:id`, async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await jobs.findOne(query);
    res.send(result);
})


app.post('/jobs', async (req, res) => {
    const job = req.body;
    const result = await jobs.insertOne(job);
    res.send(result);
})


app.delete('/jobs/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await jobs.deleteOne(query);
    res.send(result);
})


// applications related apis

app.get('/applications', async (req, res) => {

    const query = {};

    if (req.query.applicantId) {
        query.userId = req.query.applicantId;
    }

    const cursor = applications.find(query);
    const result = await cursor.toArray();
    res.send(result);
})

app.post('/applications', authenticate, async (req, res) => {
    res.status(201).json(await submitApplication(req.user, req.body));
});

app.use(errorHandler);

app.listen(port, () => {
    console.log(`hire loop is running on port ${port}`)
})
