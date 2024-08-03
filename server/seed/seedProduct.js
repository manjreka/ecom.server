require('dotenv').config()
const mongoose = require('mongoose')
const database = process.env.MONGO_URL

mongoose.connect(database)
.then(() => {
    console.log('database connected successfully!!')
})
.catch((err) => {
    console.log('error while connecting to database')
})


const product = require('../models/product')
const productSeed = require('./seedProduct.json')

async function uploadProductSeedData(){
    try{
        await product.insertMany(productSeed)
        console.log('product seed uploaded successfully')
    }
    catch(err){
        console.log('error while uploading product seed')
    }
    }
    
    uploadProductSeedData()