
const checkAdmin = (req, res, next) => {
    const {role} = req 
    console.log('we are in check admin')
    console.log(role)
    if (role === 'Admin') {
        console.log('role')
        next()
    }
    else {
        return res.status(403).json({ message: "only admin can add, update or delete product" })
    }
};


module.exports = {checkAdmin}