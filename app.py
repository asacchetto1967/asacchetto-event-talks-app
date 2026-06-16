import time
import logging
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template, request
import requests
from bs4 import BeautifulSoup

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

CACHE_TIMEOUT = 300  # 5 minutes
cache = {
    'data': None,
    'timestamp': 0
}

def fetch_and_parse_release_notes():
    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    logger.info(f"Fetching BigQuery release notes from {url}")
    
    response = requests.get(url, timeout=15)
    response.raise_for_status()
    
    # Parse Atom XML feed
    root = ET.fromstring(response.content)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    
    entries = []
    
    # Find all <entry> tags
    for entry_elem in root.findall('atom:entry', ns):
        title_elem = entry_elem.find('atom:title', ns)
        date_str = title_elem.text if title_elem is not None else "Unknown Date"
        
        # Link
        link_elem = entry_elem.find('atom:link[@rel="alternate"]', ns)
        if link_elem is None:
            link_elem = entry_elem.find('atom:link', ns)
        link = link_elem.attrib.get('href', '') if link_elem is not None else ""
        
        # Content (HTML)
        content_elem = entry_elem.find('atom:content', ns)
        html_content = content_elem.text if content_elem is not None else ""
        
        # Parse individual updates from HTML
        soup = BeautifulSoup(html_content, 'html.parser')
        
        current_type = "Update"
        current_elements = []
        updates = []
        
        # Iterate over all children including text nodes
        for child in soup.children:
            if getattr(child, 'name', None) == 'h3':
                if current_elements:
                    description_html = "".join(str(e) for e in current_elements).strip()
                    description_text = BeautifulSoup(description_html, 'html.parser').get_text(separator=' ').strip()
                    description_text = " ".join(description_text.split())
                    updates.append({
                        'type': current_type,
                        'description_html': description_html,
                        'description_text': description_text
                    })
                    current_elements = []
                current_type = child.get_text().strip()
            else:
                current_elements.append(child)
                
        # Append last element set
        if current_elements:
            description_html = "".join(str(e) for e in current_elements).strip()
            description_text = BeautifulSoup(description_html, 'html.parser').get_text(separator=' ').strip()
            description_text = " ".join(description_text.split())
            if description_text:  # Avoid appending empty updates
                updates.append({
                    'type': current_type,
                    'description_html': description_html,
                    'description_text': description_text
                })
                
        # If no updates parsed but content exists
        if not updates and html_content.strip():
            description_text = soup.get_text(separator=' ').strip()
            description_text = " ".join(description_text.split())
            updates.append({
                'type': 'Update',
                'description_html': html_content,
                'description_text': description_text
            })
            
        # Structure parsed updates
        for i, upd in enumerate(updates):
            # Create a clean unique identifier
            upd_id = f"{date_str.replace(' ', '_').replace(',', '').lower()}_{i}"
            entries.append({
                'id': upd_id,
                'date': date_str,
                'link': link,
                'type': upd['type'],
                'description_html': upd['description_html'],
                'description_text': upd['description_text']
            })
            
    logger.info(f"Successfully parsed {len(entries)} updates from feed.")
    return entries

def get_release_notes(force_refresh=False):
    now = time.time()
    if force_refresh or cache['data'] is None or (now - cache['timestamp']) > CACHE_TIMEOUT:
        try:
            cache['data'] = fetch_and_parse_release_notes()
            cache['timestamp'] = now
        except Exception as e:
            logger.error(f"Failed to refresh release notes: {e}")
            if cache['data'] is not None:
                logger.info("Serving stale data from cache")
            else:
                raise e
    return cache['data']

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def api_releases():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    try:
        data = get_release_notes(force_refresh=force_refresh)
        return jsonify({
            'success': True,
            'data': data,
            'cached_at': cache['timestamp']
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
