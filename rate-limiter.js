let rateLimits=new Map()
function rateLimiter(req,res,next)
{
    const ip=req.ip;
    const now=Date.now();
    let record=rateLimits.get(ip);
    if(!record||now-record.windowStart>3600000)
    {
        rateLimits.set(ip,{count:1,windowStart:now});
        return next()
    }
    if(record.count<parseInt(process.env.MAX_REQUESTS,10))
    {
        record.count++
        return next()
    }
    return res.status(429).json({
        error:"Rate limit reached. Too many requests, try again later."
    })
}
export default rateLimiter