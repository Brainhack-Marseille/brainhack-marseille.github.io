#!/usr/bin/env python3
"""
Generate projects JSON from GitHub issues for BrainHack Marseille website.

This script fetches approved project issues from GitHub and generates a JSON file
that can be consumed by client-side JavaScript for dynamic rendering.

Approval Criteria:
- Issues must have the label "status:web_ready" (primary)
- Or "status:approved" (alternative)
- Must also have "project" label
- Both OPEN and CLOSED issues are included (closed = archived projects)

Workflow:
1. Participant submits project → Issue created (open)
2. Admin reviews → Adds approval label (project:approved)
3. Project appears on website
4. Admin closes issue → Project remains on website (archived)
5. If reopened and edited → Changes reflected on website
"""

import os
import re
import json
import requests
from typing import List, Dict, Any

# Configuration
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
REPO = os.environ.get('GITHUB_REPOSITORY', 'Brainhack-Marseille/brainhack-marseille.github.io')
OUTPUT_FILE = 'assets/data/projects_2026.json'
APPROVAL_LABELS = ['project:approved']


def fetch_approved_issues() -> List[Dict[str, Any]]:
    """
    Fetch all approved project issues from GitHub (both open and closed).
    
    Closed issues represent completed/archived projects that should remain visible.
    
    Returns:
        List of issue dictionaries containing project information
    """
    headers = {'Authorization': f'token {GITHUB_TOKEN}'} if GITHUB_TOKEN else {}
    
    # Fetch all issues with 'project' label (both open and closed)
    url = f'https://api.github.com/repos/{REPO}/issues'
    params = {
        'labels': 'project',
        'state': 'all',  # Fetch both open and closed issues
        'per_page': 100
    }
    
    print(f"📥 Fetching issues from {REPO}...")
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    
    all_issues = response.json()
    print(f"   Found {len(all_issues)} issue(s) with 'project' label")
    
    # Filter for approved issues (both open and closed)
    approved_issues = []
    for issue in all_issues:
        labels = [label['name'] for label in issue.get('labels', [])]
        
        # Check if issue has approval label
        is_approved = any(label in labels for label in APPROVAL_LABELS)
        
        if is_approved:
            state = issue.get('state', 'unknown')
            approved_issues.append(issue)
            print(f"   ✓ #{issue['number']}: {issue['title']} [{state}]")
    
    print(f"\n✅ {len(approved_issues)} approved project(s) (open + closed)")
    return approved_issues


def parse_issue_body(body: str) -> Dict[str, str]:
    """
    Parse the GitHub issue body to extract project information.
    
    The issue body follows a specific format with markdown headers (### Field Name).
    This function extracts each section.
    
    Args:
        body: Raw issue body text
        
    Returns:
        Dictionary mapping field names to their values
    """
    if not body:
        return {}
    
    sections = {}
    current_section = None
    current_content = []
    
    for line in body.split('\n'):
        # Check if this is a section header
        if line.startswith('### '):
            # Save previous section if exists
            if current_section:
                sections[current_section] = '\n'.join(current_content).strip()
            
            # Start new section
            current_section = line.replace('### ', '').strip()
            current_content = []
        elif current_section:
            # Add content to current section
            current_content.append(line)
    
    # Save last section
    if current_section:
        sections[current_section] = '\n'.join(current_content).strip()
    
    return sections


def clean_text(text: str) -> str:
    """
    Clean and format text for JSON output.

    Args:
        text: Raw text from issue

    Returns:
        Cleaned text
    """
    if not text:
        return ''

    # Remove "No response" placeholders
    if text.strip().lower() in ['no response', '*no response*', '_no response_']:
        return ''

    # Remove placeholder instructions
    if 'PLEASE DELETE THESE INSTRUCTIONS' in text:
        lines = [l for l in text.split('\n')
                if 'PLEASE DELETE' not in l and not l.strip().startswith('- (')]
        text = '\n'.join(lines).strip()

    # Remove "Leave this text if you don't have an image yet"
    if "Leave this text if you don't have an image yet" in text:
        return ''

    return text.strip()


def extract_image_url(text: str) -> str:
    """
    Extract image URL from HTML img tag or markdown format.

    Args:
        text: Raw text containing image (HTML img tag, markdown, or plain URL)

    Returns:
        Clean image URL or empty string
    """
    if not text:
        return ''

    text = text.strip()

    # Check for placeholder text
    if "Leave this text if you don't have an image yet" in text:
        return ''

    # Try to extract from HTML img tag: <img ... src="URL" ... />
    img_match = re.search(r'src=["\'](https?://[^"\']+)["\']', text)
    if img_match:
        return img_match.group(1)

    # Try to extract from markdown: ![alt](URL)
    md_match = re.search(r'!\[.*?\]\((https?://[^)]+)\)', text)
    if md_match:
        return md_match.group(1)

    # Check if it's a plain URL
    if text.startswith('http://') or text.startswith('https://'):
        # Extract just the URL if there's extra text
        url_match = re.search(r'(https?://[^\s]+)', text)
        if url_match:
            return url_match.group(1)

    return ''


def extract_project_data(issue: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract structured project data from a GitHub issue.
    
    Args:
        issue: GitHub issue dictionary
        
    Returns:
        Structured project data ready for JSON export
    """
    body = issue.get('body', '')
    sections = parse_issue_body(body)
    
    # Extract labels for categorization
    labels = [label['name'] for label in issue.get('labels', [])]
    
    # Build project object
    project = {
        # Basic info
        'id': issue['number'],
        'title': clean_text(sections.get('Title', issue['title'])),
        'leaders': clean_text(sections.get('Leaders', '')),
        'collaborators': clean_text(sections.get('Collaborators', '')),
        
        # Content
        'description': clean_text(sections.get('Project Description', '')),
        'goals': clean_text(sections.get('Goals for Brainhack Marseille 2026', '')),
        'learning': clean_text(sections.get('What will participants learn?', '')),
        
        # Resources
        'repository': clean_text(sections.get('Link to project repository/sources', '')),
        'communication': clean_text(sections.get('Communication channels', '')),
        'onboarding': clean_text(sections.get('Onboarding documentation', '')),
        'data': clean_text(sections.get('Data to use', '')),
        
        # Requirements
        'skills': clean_text(sections.get('Skills', '')),
        'good_first_issues': clean_text(sections.get('Good first issues', '')),
        'num_collaborators': clean_text(sections.get('Number of collaborators', '')),

        # Visual - extract URL from HTML/markdown
        'image': extract_image_url(sections.get('Image', '')),

        # Metadata (from dropdowns)
        'type': clean_text(sections.get('Type', '')),
        'development_status': clean_text(sections.get('Development status', '')),
        'topics': clean_text(sections.get('Topic', '')),
        'tools': clean_text(sections.get('Tools', '')),
        'programming_languages': clean_text(sections.get('Programming language', '')),
        'modalities': clean_text(sections.get('Modalities', '')),
        'git_skills': clean_text(sections.get('Git skills', '')),
        
        # Links
        'issue_url': issue['html_url'],
        
        # Timestamps
        'created_at': issue['created_at'],
        'updated_at': issue['updated_at'],
        
        # All labels (for filtering)
        'labels': labels
    }
    
    return project


def save_projects_json(projects: List[Dict[str, Any]]) -> None:
    """
    Save project data as JSON file.
    
    Args:
        projects: List of project dictionaries
    """
    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    # Save JSON with pretty formatting
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(projects, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Saved {len(projects)} project(s) to {OUTPUT_FILE}")
    
    # Print file size
    size = os.path.getsize(OUTPUT_FILE)
    print(f"   File size: {size:,} bytes ({size/1024:.1f} KB)")


def main():
    """Main execution function."""
    print("=" * 70)
    print("  BrainHack Marseille - Project JSON Generator")
    print("=" * 70)
    print()
    
    # Check for GitHub token
    if not GITHUB_TOKEN:
        print("⚠️  Warning: GITHUB_TOKEN not set")
        print("   You may hit API rate limits (60 requests/hour)")
        print("   Set token: export GITHUB_TOKEN='your_token'")
        print()
    
    try:
        # Fetch approved issues
        issues = fetch_approved_issues()
        
        if not issues:
            print("\nℹ️  No approved projects found.")
            print("\n   To approve a project:")
            print("   1. Go to the GitHub issue")
            print("   2. Add label 'project:approved'")
            print("   3. Run this script again")
            
            # Create empty JSON file
            save_projects_json([])
            return
        
        # Extract project data
        print("\n📝 Parsing project data...")
        projects = []
        
        for issue in issues:
            try:
                project = extract_project_data(issue)
                projects.append(project)
                print(f"   ✓ Parsed: {project['title']}")
            except Exception as e:
                print(f"   ✗ Error parsing issue #{issue['number']}: {e}")
        
        if not projects:
            print("\n❌ No valid projects found")
            save_projects_json([])
            return
        
        # Save to JSON
        print("\n💾 Saving to JSON...")
        save_projects_json(projects)
        
        print("\n" + "=" * 70)
        print("✅ Generation complete!")
        print("=" * 70)
        print("\nNext steps:")
        print("1. Commit the generated JSON file")
        print("2. Push to GitHub")
        print("3. Your website will automatically load and display projects")
        
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Error fetching from GitHub: {e}")
        raise
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        raise


if __name__ == '__main__':
    main()