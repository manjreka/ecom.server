const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
require('dotenv').config()

const { userAuthentication } = require('./middleware/auth')
const { checkAdmin } = require('./middleware/checkAdmin')


const app = express()
app.use(cors())
app.use(bodyParser.json())

const database = process.env.MONGO_URL
mongoose.connect(database)
    .then(() => {
        console.log('Database connected successfully!!')
    })
    .catch((err) => {
        console.log('err while connecting to DB', err)
    })

const SECRETE_KEY = process.env.SECRETE_KEY
const PORT = process.env.PORT || 4512


const user = require('./models/user')
const session = require('./models/session')
const cart = require('./models/cart')
const product = require('./models/product')
const order = require('./models/order')
const payment = require('./models/payment')

app.listen(PORT, () => {
    console.log(`server connected successfully to port: ${PORT}`)
})


// api calls 

// registration API 
app.post('/register', async (req, res) => {
    try {
        const { email, name, role, password, confirmPassword } = req.body
        console.log(req.body)
        const oldUser = await user.findOne({ email })
        console.log(`olduser: ${oldUser}`)
        if (oldUser) {
            return res.status(400).json({ message: 'email already in use' })
        }
        const hasedPassword = await bcrypt.hash(password, 10)
        const hasedConfirmPassword = await bcrypt.hash(confirmPassword, 10)
        const newUser = new user({ email, password: hasedPassword, confirmPassword: hasedConfirmPassword, name, role })

        console.log(`newUser: ${newUser}`)

        if (password !== confirmPassword) {

            return res.status(401).json({ message: 'password not matching confirm password' })

        }

        await newUser.save()
        res.status(201).json({ message: 'user created sccessfully!!' })

    }
    catch (err) {
        res.status(500).json({ error: "error while signing up!!", err })
    }
})

//login API 
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const userInfo = await user.findOne({ email })
        console.log(userInfo)

        if (!userInfo) {
            return res.status(400).json('Kindly register to login!!')
        }


        const passwordValidation = await bcrypt.compare(password, userInfo.password)
        console.log(passwordValidation)

        if (!passwordValidation) {
            return res.status(400).json({ message: 'inValid Password' })
        }

        const token = jwt.sign({ user: userInfo }, SECRETE_KEY, { expiresIn: '800hr' })
        //, idUser: userInfo._id, role: userInfo.role

        const newSession = new session({ loginTime: Date.now(), ipAddress: token, userId: userInfo._id })

        await newSession.save()

        return res.status(200).json({ message: 'Login Successfull!!', token })
    }
    catch (err) {
        return res.status(500).json({ message: 'Err while logging in', err })
    }
})

// create product (Permission given to only Admins) 
app.post('/products', userAuthentication, checkAdmin, async (req, res) => {
    try {
        const { title, brand, price, id, imageUrl, rating } = req.body;
        const existingProduct = await product.findOne({ id })
        if (existingProduct) {
            return res.status(401).json({ message: 'this product already exist' })
        }
        const newProduct = new product({ title, brand, price, id, imageUrl, rating })
        await newProduct.save()
        return res.status(200).json({ message: 'product created successfully!!' })
    }
    catch (err) {
        return res.status(500).json({ message: 'err while creating a product', err })
    }
})

//update product (Permission given to only Admins) 
app.put('/products/:id', userAuthentication, checkAdmin, async (req, res) => {
    try {
        console.log('hello update')
        const { id } = req.params
        console.log(id)
        const existingProduct = await product.findOne({ _id: id })
        console.log(existingProduct)
        if (!existingProduct) {
            return res.status(400).json({ message: "product not found" })
        }

        const updatedProduct = await product.findByIdAndUpdate(id, req.body)
        return res.status(200).json({ message: 'product updated successfully!!' })
    }
    catch (err) {
        return res.status(500).json({ message: 'err while updating a product', err })
    }
})

//delete product (Permission given to only Admins)
app.delete('/products/:id', userAuthentication, checkAdmin, async (req, res) => {
    try {
        const { id } = req.params
        const existingProduct = await product.findById({ _id: id })
        if (!existingProduct) {
            return res.status(400).json({ message: "product not found" })
        }
        await product.findByIdAndDelete({ _id: id })
        return res.status(401).json({ message: 'product deleted successfully!!' })
    }
    catch (err) {
        return res.status(500).json({ message: 'err while deleting a product', err })
    }
})

// get all products 
app.get('/products', userAuthentication, async (req, res) => {
    try {
        const products = await product.find()
        if (!products) {
            return res.status(401).json({ messge: 'cannot find products' })
        }
        return res.status(201).json({ message: "products retrived!!", products })
    }
    catch (err) {
        return res.status(500).json({ message: 'error while fetching data from DB' })
    }
})

//get a single Product 
app.get('/product/:id', userAuthentication, async (req, res) => {
    try {
        const { id } = req.params
        const productItem = await product.findOne({ _id: id })
        console.log(productItem)
        if (!productItem) {
            return res.status(401).json({ message: 'error while fetching data from server' })
        }
        return res.status(200).json({ message: 'information logged successgully', productItem })
    }
    catch (err) {
        return res.status(500).json({ message: 'error while fetching data from DB' })
    }

})


// Add an item to the cart
app.post('/cart', userAuthentication, async (req, res) => {
    try {
        const { idUser } = req // Extracted from the token in the middleware
        const { productId, quantity } = req.body;

        // Validate that the product exists
        const productex = await product.findById(productId);
        if (!productex) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Find the user's cart or create a new one
        let carts = await cart.findOne({ idUser })

        if (!carts) {
            // If no cart exists for the user, create a new one
            carts = new cart({ userId: idUser, item: [] });
        }

        // Check if the product is already in the cart
        const existingItemIndex = carts.item.findIndex(items => items.productId.toString() === productId);

        if (existingItemIndex > -1) {
            // If the product already exists in the cart, update the quantity
            carts.item[existingItemIndex].quantity += quantity;
        } else {
            // If the product is not in the cart, add it
            carts.item.push({ productId, quantity });
        }

        // Save the cart
        

        await carts.populate('item.productId')

        await carts.save();

        res.status(200).json({ message: 'Item added to cart', carts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// get cart deatils of user
app.get('/cart', userAuthentication, async (req, res) => {
    try {
        const { idUser } = req
        const cartItems = await cart.findOne({ userId: idUser }).populate('item.productId')
        console.log(cartItems)
        if (!cartItems) {
            return res.status(401).json({ messge: 'cannot display cart' })
        }
        return res.status(201).json({ message: "cart items retrived!!", cartItems })
    }
    catch (err) {
        return res.status(500).json({ message: 'error while fetching data from DB' })
    }
})

//create Order
app.post('/orders', userAuthentication, async (req, res) => {
    try {
        const { idUser } = req
        // Find the user's cart
        const userCart = await cart.findOne({ userId: idUser }).populate('item.productId');
        if (!userCart) {
            return res.status(400).json({ message: 'No products added to cart!!' })
        }
        console.log(userCart)

        const allItemCart = userCart.item
        let finalAmount = null

        for (let itemProduct of allItemCart) {
            const { productId, quantity } = itemProduct
            const { price } = productId
            let amount = price * quantity
            finalAmount += amount
        }
        console.log(finalAmount)

        // Create a new order with the cart items and total amount
        const newOrder = new order({
            userId: idUser,
            items: allItemCart,
            totalAmount: finalAmount,
            orderDate: new Date()
        });

        // Save the order
        await newOrder.save();

        return res.status(201).json({ message: 'Order placed successfully', newOrder });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//get order Details 
app.get('/order', userAuthentication, async (req, res) => {
    try {
        const { idUser } = req
        console.log(idUser)
        const orderDetails = await order.find({ userId: idUser })
        if (!orderDetails) {
            return res.status(401).json({ message: 'no orders found' })
        }
        return res.status(201).json({ message: 'orders retrived successfully!!', orderDetails })
    }
    catch (err) {
        return res.status(500).json({ message: 'error while fetching data from DB' })
    }
})

//insert login time when logout button on frontend clicked!!
app.post('/logout', userAuthentication, async (req, res) => {
    try {
        const { idUser } = req
        const sessionItem = await session.findOne({ userId: idUser })
        sessionItem.logoutTime = Date.now()
        await sessionItem.save()
        return res.status(200).json({ message: 'logout session recorded successfully!!', sessionItem })
    }
    catch (err) {
        return res.status(500).json({ message: 'error while fetching data from DB' })
    }
})

//get session details 
app.get('/session', userAuthentication, async (req, res) => {
    try {
        const sessionDetails = await session.find()
        if (!sessionDetails) {
            return res.status(401).json({ message: "not session details found!!" })
        }
        return res.status(200).json({ message: "session data fetched successfully!!", sessionDetails })
    }
    catch (err) {
        return res.status(500).json({ message: 'error while fetching data from DB' })
    }
})

// make payment request
app.post('/payment', userAuthentication, async (req, res) => {
    try {
        const { totalAmount, currency, paymentType, status } = req.body
        if (status === 'fail') {
            return res.status(401).json({ message: 'payment transaction failed!!' })
        }
        const newPayment = new payment({ totalAmount, currency, paymentType, status })
        await newPayment.save()
        return res.status(201).json({ message: 'payment successfull', newPayment })
    }
    catch (err) {
        return res.status(500).json({ message: 'error while fetching data from DB', err })
    }
})













