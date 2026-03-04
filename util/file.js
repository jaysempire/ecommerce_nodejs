const fs = require('fs');
const path = require('path')

const deleteFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            throw (err);
        }
    })
};

/* const accessLog = fs.createWriteStream(
    path.join(__dirname, '..', 'access.log'),
    {flags: 'a'}
)
 */
exports.deleteFile = deleteFile;
