self.onmessage = async (event) => {
    const { codeToHtml } = await import ("shiki");
    const { code, lang } = event.data;
    
    try {
        
        // Highlight the code
        const highlighted = await codeToHtml(code, { lang: lang as string, theme: "github-dark"});
        
        // Send the result back
        self.postMessage({ success: true, html: highlighted });
    } catch (error) {
        self.postMessage({ success: false, error: JSON.stringify(error) });
    }
};