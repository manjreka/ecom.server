require('dotenv').config()

const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const user = require('../models/user')

const database = process.env.MONGO_URL 
mongoose.connect(database)
.then(() => {
    console.log('Database connected successfully!!')
})
.catch((err) => {
    console.log('err while connecting to DB', err)
})

async function createAdmin(){
    try{
        const name = process.env.ADMIN_NAME  || "ashwarya"
        const email = process.env.ADMIN_EMAIL || "ashwarya@gmail.com"
        const password = process.env.ADMIN_PASSWORD || "@12345"
        const confirmPassword = process.env.ADMIN_CONFIRMPASSWORD || "@12345"

        const existingAdmin = await user.findOne({email})

        if (existingAdmin) {
            return console.log('admin already exist')
        }

        if (password !== confirmPassword) {
            return console.log('passwords not matching!!')
        }

        const hasedPassword = await bcrypt.hash(password, 10)
        const confirmHashedPassword = await bcrypt.hash(confirmPassword, 10)
        const newUser = new user({name, email, password: hasedPassword, confirmPassword: confirmHashedPassword, role: 'Admin'})
        await newUser.save()
        return console.log('admin created successfully')
    }

    catch(err){
        return console.log(`error hile creating admin. err: ${err}`)

    }

    finally{
        mongoose.connection.close()
    }
}

createAdmin()