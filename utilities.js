import {URL} from "url";
import pool from "./connecting.js";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();
export const normalizeURL=(long_url)=>{
    //normalizing long_url
    const regex1=/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//,regex2=/^[a-zA-Z0-9]+/;
    try{
    if(!regex1.test(long_url)&&regex2.test(long_url))
        long_url="https://"+long_url;
    const lurl=new URL(long_url);
    //the URL parser will automatically convert the host and protocol to lowercase, so no need to worry
    if(lurl.protocol!=="http:"&&lurl.protocol!=="https:")
        throw new Error("Protocol Error: Only http and https protocols are allowed.");
    console.log("Protocol: "+lurl.protocol);
    console.log("Host: "+lurl.host);
    console.log("Path: "+lurl.pathname);
    lurl.hash="";
    return lurl;
    }
    catch(err)
    {
        console.error(err.message);
        return null;
    }
}
export const insertURL=async(lurl)=>{
    let attempts=0;
    //here, pool.connect() is not used, since that will be reqd for transactions, not for simple operations like 1-2 queries
    //constraint names are - unique_shorts -> short_url (unique) and unique_urls -> long_url (unique)
    do{
        try{
        let scode="",seq="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for(let i=0;i<10;i++)
        {
            const unit=crypto.randomInt(0,62);
            scode+=seq[unit];
        }
        let result = await pool.query(`INSERT INTO urls (long_url, short_url, click_count, window_start, window_count) VALUES ($1,$2,$3,$4,$5) RETURNING id`,[lurl.href,scode,0,new Date(),0]);
        return {code:0,result:scode};
        }
        catch(err){
        if(err.constraint==="unique_urls")
        {
            let result=await pool.query(`SELECT short_url FROM urls WHERE long_url=$1`,[lurl.href]);
            return {code:1, result:result.rows[0].short_url};
        }
        else if(err.constraint!=="unique_shorts")
            return {code:2, result:"Database Error: "+err.message};
        }
    }while(++attempts<=parseInt(process.env.MAX_ATTEMPTS,10));
    return {code:3,result:"Failed to generate unique short code after "+process.env.MAX_ATTEMPTS+" attempts"};
}
export const getURL=async(surl)=>{
    try{
    let result=await pool.query(`SELECT long_url, click_count, window_start, window_count FROM urls WHERE short_url=$1`,[surl]);
    if(result.rows.length === 0)
        throw new Error("Short URL not found");
    if(new Date()-result.rows[0].window_start<=3600000&&result.rows[0].window_count+1<=parseInt(process.env.MAX_ACCESS,10))
    {
        await pool.query(`UPDATE urls SET click_count=click_count+1, window_count=window_count+1 WHERE short_url=$1`,[surl]);
        return result.rows[0].long_url;
    }
    else if(new Date()-result.rows[0].window_start>3600000)
    {
        await pool.query(`UPDATE urls SET click_count=click_count+1, window_start=$1, window_count=1 WHERE short_url=$2`,[new Date(),surl]);
        return result.rows[0].long_url;
    }
    else
        throw new Error("Rate Limit Exceeded: Maximum access limit of "+process.env.MAX_ACCESS+" per hour exceeded for this URL.");
    }catch(err){
        console.error("Database Error (Request could not be resolved): "+err.message);
        throw err;
    }
}