/**
 * Velix v5 Error Pages
 * Beautiful error pages inspired by Next.js latest design
 */

export interface ErrorPageOptions {
  statusCode: number;
  title: string;
  message: string;
  stack?: string;
  isDev?: boolean;
  pathname?: string;
}

/**
 * Generate a styled 404 error page
 */
export function generate404Page(pathname: string = '/'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Page Not Found | Velix v5</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          margin: 0; 
          background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); 
          color: white; 
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          min-height: 100vh; 
          text-align: center;
          overflow: hidden;
        }
        .container { 
          max-width: 700px; 
          padding: 60px 40px; 
          position: relative;
          z-index: 10;
        }
        .bg-pattern {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle at 20% 50%, rgba(34, 211, 238, 0.1) 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, rgba(37, 99, 235, 0.1) 0%, transparent 50%);
          z-index: 1;
        }
        h1 { 
          font-size: 180px; 
          font-weight: 900; 
          margin: 0; 
          background: linear-gradient(135deg, #22D3EE 0%, #2563EB 100%); 
          -webkit-background-clip: text; 
          -webkit-text-fill-color: transparent; 
          line-height: 1; 
          letter-spacing: -0.05em;
          animation: fadeInUp 0.6s ease-out;
        }
        h2 { 
          font-size: 36px; 
          font-weight: 800; 
          margin: 30px 0 15px; 
          color: #F8FAFC;
          animation: fadeInUp 0.6s ease-out 0.1s backwards;
        }
        p { 
          color: #94A3B8; 
          font-size: 18px; 
          line-height: 1.7; 
          margin-bottom: 40px;
          animation: fadeInUp 0.6s ease-out 0.2s backwards;
        }
        code { 
          background: rgba(255,255,255,0.1); 
          padding: 4px 10px; 
          border-radius: 6px; 
          font-family: 'Fira Code', 'Courier New', monospace; 
          color: #22D3EE; 
          font-size: 16px;
          border: 1px solid rgba(34, 211, 238, 0.2);
        }
        .btn-group {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
          animation: fadeInUp 0.6s ease-out 0.3s backwards;
        }
        .btn { 
          display: inline-block; 
          background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); 
          color: white; 
          text-decoration: none; 
          padding: 14px 36px; 
          border-radius: 12px; 
          font-weight: 600; 
          font-size: 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
          box-shadow: 0 10px 30px rgba(37, 99, 235, 0.3);
          border: none;
          cursor: pointer;
        }
        .btn:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 15px 40px rgba(37, 99, 235, 0.4);
        }
        .btn-outline { 
          background: transparent; 
          color: #22D3EE; 
          border: 2px solid #22D3EE; 
          box-shadow: none;
        }
        .btn-outline:hover { 
          background: rgba(34, 211, 238, 0.1); 
          box-shadow: 0 10px 30px rgba(34, 211, 238, 0.2);
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
    </style>
</head>
<body>
    <div class="bg-pattern"></div>
    <div class="container">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page <code>${pathname}</code> could not be found.<br>It may have been moved or deleted.</p>
        <div class="btn-group">
          <a href="/" class="btn">Return Home</a>
          <a href="javascript:history.back()" class="btn btn-outline">Go Back</a>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generate a styled 500 error page
 */
export function generate500Page(options: ErrorPageOptions): string {
  const { title, message, stack, isDev, pathname } = options;

  // Parse stack trace to display as cards like Next.js
  let callStackCards = '';
  let frameCount = 0;
  
  if (isDev && stack) {
    const stackLines = stack.split('\n').filter(line => line.trim());
    const frames = stackLines.slice(1).filter(line => line.includes('at '));
    frameCount = frames.length;
    
    callStackCards = frames.map((frame, index) => {
      const match = frame.match(/at\s+(.+?)\s+\((.+?)\)/) || frame.match(/at\s+(.+)/);
      if (match) {
        const funcName = match[1] || 'anonymous';
        const location = match[2] || match[1];
        return `
          <div class="error-card" data-frame="${index}">
            <div class="card-header">
              <div class="card-title">${funcName.trim()}</div>
              <div class="card-number">${index + 1}</div>
            </div>
            <div class="card-location">${location.trim()}</div>
          </div>
        `;
      }
      return '';
    }).join('');
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error | Velix v5</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          margin: 0; 
          background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
          color: #F8FAFC; 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          min-height: 100vh;
          overflow-x: hidden;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .error-header {
          background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
          color: white;
          padding: 20px 28px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 28px;
          font-size: 18px;
          font-weight: 700;
          box-shadow: 0 10px 40px rgba(239, 68, 68, 0.3);
        }
        .error-header svg {
          width: 24px;
          height: 24px;
          flex-shrink: 0;
        }
        .error-badge {
          display: inline-block;
          background: linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%);
          color: #60A5FA;
          padding: 6px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 18px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
        }
        .route-badge {
          background: linear-gradient(135deg, #0C4A6E 0%, #075985 100%);
          color: #22D3EE;
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 14px;
          margin-bottom: 24px;
          font-family: 'Courier New', monospace;
          box-shadow: 0 4px 12px rgba(12, 74, 110, 0.3);
          border: 1px solid rgba(34, 211, 238, 0.2);
        }
        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border-left: 4px solid #EF4444;
          padding: 18px 20px;
          border-radius: 10px;
          margin-bottom: 32px;
        }
        .error-message-text {
          color: #FCA5A5;
          font-size: 16px;
          font-weight: 600;
          line-height: 1.6;
          font-family: 'Courier New', monospace;
        }
        .stack-section {
          margin-top: 32px;
        }
        .stack-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .stack-title {
          font-size: 18px;
          font-weight: 700;
          color: #F1F5F9;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .frame-counter {
          background: linear-gradient(135deg, #1F2937 0%, #111827 100%);
          color: #22D3EE;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          border: 1px solid rgba(34, 211, 238, 0.2);
        }
        .error-card {
          background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
          border: 1px solid rgba(34, 211, 238, 0.2);
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          display: none;
        }
        .error-card.active {
          display: block;
          animation: slideIn 0.3s ease-out;
        }
        .error-card:hover {
          border-color: rgba(34, 211, 238, 0.5);
          box-shadow: 0 8px 24px rgba(34, 211, 238, 0.2);
          transform: translateY(-2px);
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .card-title {
          color: #22D3EE;
          font-size: 15px;
          font-weight: 700;
          font-family: 'Courier New', monospace;
        }
        .card-number {
          background: rgba(34, 211, 238, 0.2);
          color: #22D3EE;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
        }
        .card-location {
          color: #94A3B8;
          font-size: 13px;
          font-family: 'Courier New', monospace;
          word-break: break-all;
          line-height: 1.6;
        }
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          margin-top: 24px;
        }
        .pagination-btn {
          background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
          border: 1px solid rgba(34, 211, 238, 0.3);
          color: #22D3EE;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .pagination-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #22D3EE 0%, #06B6D4 100%);
          color: #0F172A;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(34, 211, 238, 0.4);
        }
        .pagination-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .pagination-info {
          color: #94A3B8;
          font-size: 14px;
          font-weight: 600;
        }
        .footer {
          margin-top: 48px;
          padding-top: 28px;
          border-top: 1px solid rgba(34, 211, 238, 0.2);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          color: #22D3EE;
          font-size: 15px;
        }
        .brand img {
          width: 20px;
          height: 20px;
        }
        .footer-links {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }
        .footer-links a {
          color: #60A5FA;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.2s;
          font-size: 14px;
        }
        .footer-links a:hover {
          color: #22D3EE;
          transform: translateY(-1px);
        }
        .no-stack {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          padding: 32px;
          color: #FCA5A5;
          text-align: center;
          font-size: 15px;
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-header">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <span>Unhandled Runtime Error</span>
        </div>
        
        <div class="error-badge">SERVER ERROR 500</div>
        ${pathname ? `<div class="route-badge">Route: ${pathname}</div>` : ''}
        
        <div class="error-message">
            <div class="error-message-text">${message}</div>
        </div>
        
        ${isDev && callStackCards ? `
        <div class="stack-section">
            <div class="stack-header">
                <div class="stack-title">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    Call Stack
                </div>
                <div class="frame-counter">${frameCount}</div>
            </div>
            <div id="error-cards">
                ${callStackCards}
            </div>
            ${frameCount > 1 ? `
            <div class="pagination">
                <button class="pagination-btn" id="prev-btn" onclick="changePage(-1)">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:4px;">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                    Previous
                </button>
                <div class="pagination-info">
                    <span id="current-page">1</span> / <span id="total-pages">${frameCount}</span>
                </div>
                <button class="pagination-btn" id="next-btn" onclick="changePage(1)">
                    Next
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-left:4px;">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                </button>
            </div>
            ` : ''}
        </div>
        ` : '<div class="no-stack">An error occurred while processing your request. Please check the server logs for more details.</div>'}
        
        <div class="footer">
            <div class="brand">
                <img src="/__velix/logo.webp" alt="Velix" onerror="this.style.display='none'"/>
                <span>Velix v5.0.0</span>
            </div>
            <div class="footer-links">
                <a href="/">Home</a>
                <a href="javascript:location.reload()">Reload</a>
                <a href="https://github.com/velix/velix/tree/main/docs" target="_blank">Documentation</a>
                ${isDev ? '<span style="color:#94A3B8;">Development Mode</span>' : ''}
            </div>
        </div>
    </div>
    
    ${isDev && frameCount > 0 ? `
    <script>
        let currentPage = 1;
        const totalPages = ${frameCount};
        const cards = document.querySelectorAll('.error-card');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const currentPageSpan = document.getElementById('current-page');
        
        function showPage(page) {
            cards.forEach((card, index) => {
                card.classList.remove('active');
                if (index === page - 1) {
                    card.classList.add('active');
                }
            });
            
            currentPage = page;
            currentPageSpan.textContent = page;
            
            if (prevBtn) prevBtn.disabled = page === 1;
            if (nextBtn) nextBtn.disabled = page === totalPages;
        }
        
        function changePage(direction) {
            const newPage = currentPage + direction;
            if (newPage >= 1 && newPage <= totalPages) {
                showPage(newPage);
            }
        }
        
        // Show first page on load
        showPage(1);
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') changePage(-1);
            if (e.key === 'ArrowRight') changePage(1);
        });
    </script>
    ` : ''}
</body>
</html>`;
}

/**
 * Generate error page based on status code
 */
export function generateErrorPage(statusCode: number, options: Partial<ErrorPageOptions> = {}): string {
  if (statusCode === 404) {
    return generate404Page(options.pathname || '/');
  }

  return generate500Page({
    statusCode,
    title: options.title || 'Server Error',
    message: options.message || 'An unexpected error occurred',
    stack: options.stack,
    isDev: options.isDev,
    pathname: options.pathname,
  });
}
