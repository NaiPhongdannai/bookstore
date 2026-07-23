import express from "express";
import db from "./db.js"; 
import jwt from "jsonwebtoken";
import { compare } from "bcrypt";
import dotenv from "dotenv";
import cors from 'cors';

dotenv.config();

const JWT_SECRET = process.env.SECRET_KEY || process.env.SECRET_Key || 'my_super_secret_jwt_key_12345';
const PORT = process.env.PORT || 3000;

const app = express(); 
app.use(express.json()); 
app.use(cors());
app.use(express.static('public'));

const authenticateToken = (req, res, next) => {
  try {
    // Get Authorization header
    const authHeader = req.headers['authorization'];
    
    // Check if header exists and starts with 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access Denied: No Token Provided' 
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    // "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImlhdCI6MTc4NDQ0MzM5OCwiZXhwIjoxNzg0NDUwNTk4fQ.AUoA45SJQZ3OYc3OiUSJtdDdOXW7qAEjHThgZ2Wuff8"

    // Verify token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access Denied: Invalid or Expired Token' 
        });
      }

      // Attach decoded user information to request
      req.user = decoded;
      next();
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Authentication error occurred',
      error: error.message 
    });
  }
};

app.post("/api/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  // const {username, password} = req.body
  // console.log(`user : ${username}, password : ${password}`);
  

  const [users] = await db.query("SELECT * FROM users WHERE username = ? ", [username]);

  
  if (users.length === 0 || !(await compare(password, users[0].password))) {
    return res.status(404).json({msg: "User not found"});
  }
  
  const payload ={
    id: users[0].id,
    username : users[0].username
  }

  const token = jwt.sign(
    payload,
    JWT_SECRET,
    { expiresIn: '2h' } 
  );


  res.json({msg: "login สำเร็จ", token : token, user : payload});
  //  res.send("login success");


});

app.get("/api/books", authenticateToken, async (req, res) => {
  try {
    const [books] = await db.query(
      "SELECT id, title, author, published_year, price FROM books ORDER BY id ASC"
    );

    res.json({
      success: true,
      books
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "โหลดข้อมูลหนังสือไม่สำเร็จ"
    });
  }
});

app.post("/api/book", authenticateToken, async (req, res) =>{
  const {title, author, published_year, price} = req.body;
  try {
    await db.query(`INSERT INTO books 
      (title, author, published_year, price) 
      VALUES (?, ?, ?, ?)`, [title, author, published_year, price]);
      res.status(201).json({
        success : true,
        message: "เพิ่มหนังสือสำเร็จ"
      })
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success : false,
      message : "เพิ่มหนังสือไม่สำเร็จ"
    })
  }
})

app.put("/api/book/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, author, published_year, price } = req.body;

  try {
    const [result] = await db.query(
      "UPDATE books SET title = ?, author = ?, published_year = ?, price = ? WHERE id = ?",
      [title, author, published_year, price, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "ไม่พบหนังสือที่ต้องการแก้ไข" });
    }

    res.json({ success: true, message: "แก้ไขหนังสือสำเร็จ" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "แก้ไขหนังสือไม่สำเร็จ" });
  }
});

app.delete("/api/book/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query("DELETE FROM books WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "ไม่พบหนังสือที่ต้องการลบ" });
    }

    res.json({ success: true, message: "ลบหนังสือสำเร็จ" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "ลบหนังสือไม่สำเร็จ" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
