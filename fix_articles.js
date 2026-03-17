const fs = require('fs');
for (let i = 1; i <= 6; i++) {
    const file = `article-${i}.html`;
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace <article ...> ... </article> with <a href="...">...</a>
    // We can use a regex to find each article block and transform it
    content = content.replace(/<article class="journal-card reveal">([\s\S]*?)<h3 class="jc-title"><a href="([^"]+)">([^<]+)<\/a><\/h3>([\s\S]*?)<\/article>/g, 
        '<a href="$2" class="journal-card reveal" style="display:block; text-decoration:none;">$1<h3 class="jc-title">$3</h3>$4</a>');
        
    fs.writeFileSync(file, content);
}
console.log("Fixed all 6 articles");
