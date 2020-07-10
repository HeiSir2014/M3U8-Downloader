const fs = require('fs');

function repairTs(filePath)
{
    if(fs.existsSync(filePath))
    {
        let data = fs.readFileSync(filePath);
        
    }
}