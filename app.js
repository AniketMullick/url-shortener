import express from "express";
import dotenv from "dotenv";
import {normalizeURL,insertURL,getURL} from "./utilities.js";
dotenv.config();
const app=express();
app.use(express.json());
app.use(express.static('public'));
app.post("/shorten",async(req,res)=>{
    try{
    let {long_url}=req.body;//extracting the long_url key from req body
    if (!long_url || typeof long_url !== "string")
        return res.status(400).json({
        success: false,
        message: "Invalid URL input"
        });
    long_url=long_url.trim();
    const lurl=normalizeURL(long_url);
    if(lurl)
    {
        let {code,result}=await insertURL(lurl);
        if(code===0||code===1)
        {
            let surl=`${req.protocol}://${req.get("host")}/${result}`;
            if(code===0)
                res.status(200).json({
                success:true,
                message:"Short URL created successfully",
                short_url: surl
                });
            else
                res.status(200).json({
                success:true,
                message:"URL already exists in the Database",
                short_url:surl
                })
        }
        else
            res.status(500).json({
                success:false,
                message:result
            });
    }
    else
        res.status(400).json({
            success:false,
            message:"400 Bad Request: Please check your input URL and try again."
        });
    }
    catch(err){
        res.status(500).json({
            success:false,
            message:"500 Internal Server Error: An error occurred while processing your request. Please try again later."
        });
    }
});
app.get("/:shortCode",async(req,res)=>{ //shortCode is a path parameter
    try{
    let short_url=req.params.shortCode;
    short_url=short_url.trim();
    let final_url=await getURL(short_url);
    if (!final_url) {
    return res.status(404).json({
        success: false,
        message: "Short URL not found"
    });
    }
    res.redirect(302,final_url);
    console.log("Successful redirection to: "+final_url);
}
    catch(err){
        res.status(400).json({
            success:false,
            message:"400 Bad Request: Please check your input and try again."
        });
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>{
    console.log(`Yep, server listneing at port ${PORT}`);
});