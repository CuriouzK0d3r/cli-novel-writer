const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class CollaborationManager extends EventEmitter {
  constructor() {
    super();
    this.isEnabled = false;
    this.currentProject = null;
    this.collaborators = new Map();
    this.projectShares = new Map();
    this.conflicts = new Map();
    this.syncStatus = 'disconnected';
    this.lastSync = null;
    this.changeBuffer = [];
    this.syncInterval = null;
    this.wsConnection = null;

    this.config = {
      syncIntervalMs: 30000, // 30 seconds
      conflictResolution: 'manual', // 'manual', 'latest-wins', 'merge'
      enableRealTimeSync: true,
      enableComments: true,
      enableVersionHistory: true,
      maxVersionHistory: 50,
      serverUrl: process.env.WRITERS_COLLABORATION_SERVER || 'wss://collaboration.writers-cli.com'
    };

    this.permissions = {
      OWNER: 'owner',
      EDITOR: 'editor',
      COMMENTER: 'commenter',
      VIEWER: 'viewer'
    };

    this.loadCollaborationData();
  }

  // Enable/disable collaboration
  async enable() {
    try {
      this.isEnabled = true;
      await this.initializeCollaboration();
      this.emit('collaboration-enabled');
      return { success: true };
    } catch (error) {
      this.isEnabled = false;
      return { success: false, error: error.message };
    }
  }

  async disable() {
    this.isEnabled = false;
    await this.disconnectFromServer();
    this.stopSyncTimer();
    this.emit('collaboration-disabled');
    return { success: true };
  }

  // Initialize collaboration for a project
  async initializeCollaboration() {
    if (!this.currentProject) {
      throw new Error('No project is currently open');
    }

    // Create collaboration metadata
    const collabPath = path.join(this.currentProject.path, '.collaboration');
    await fs.ensureDir(collabPath);

    const metadata = {
      projectId: this.generateProjectId(),
      owner: this.getCurrentUser(),
      created: new Date().toISOString(),
      collaborators: {},
      settings: {
        allowComments: true,
        allowEditing: true,
        requireApproval: false,
        enableVersionHistory: true
      }
    };

    await fs.writeFile(
      path.join(collabPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    this.startSyncTimer();
    await this.connectToServer();

    return metadata;
  }

  // Share project with others
  async shareProject(options = {}) {
    if (!this.isEnabled || !this.currentProject) {
      throw new Error('Collaboration not enabled or no project open');
    }

    const shareId = this.generateShareId();
    const shareData = {
      shareId,
      projectId: this.currentProject.id,
      projectName: this.currentProject.name,
      owner: this.getCurrentUser(),
      permissions: options.permissions || this.permissions.EDITOR,
      expiresAt: options.expiresAt || this.getDefaultExpiry(),
      created: new Date().toISOString(),
      accessCount: 0,
      maxAccess: options.maxAccess || null
    };

    this.projectShares.set(shareId, shareData);
    await this.saveCollaborationData();

    const shareUrl = `${this.config.serverUrl}/share/${shareId}`;

    this.emit('project-shared', { shareId, shareUrl, shareData });

    return {
      success: true,
      shareId,
      shareUrl,
      permissions: shareData.permissions,
      expiresAt: shareData.expiresAt
    };
  }

  // Invite specific user to collaborate
  async inviteUser(email, permissions = this.permissions.EDITOR, message = '') {
    if (!this.isEnabled || !this.currentProject) {
      throw new Error('Collaboration not enabled or no project open');
    }

    const invitation = {
      id: this.generateInvitationId(),
      projectId: this.currentProject.id,
      projectName: this.currentProject.name,
      invitedBy: this.getCurrentUser(),
      email,
      permissions,
      message,
      status: 'pending',
      created: new Date().toISOString(),
      expiresAt: this.getDefaultExpiry()
    };

    // Send invitation via collaboration server
    try {
      await this.sendInvitation(invitation);
      this.emit('user-invited', invitation);

      return {
        success: true,
        invitationId: invitation.id,
        status: 'sent'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Accept collaboration invitation
  async acceptInvitation(invitationId) {
    try {
      const invitation = await this.getInvitation(invitationId);

      if (!invitation || invitation.status !== 'pending') {
        throw new Error('Invalid or expired invitation');
      }

      // Add user as collaborator
      const collaborator = {
        email: invitation.email,
        permissions: invitation.permissions,
        joinedAt: new Date().toISOString(),
        status: 'active',
        lastActive: new Date().toISOString()
      };

      this.collaborators.set(invitation.email, collaborator);
      await this.saveCollaborationData();

      // Update invitation status
      invitation.status = 'accepted';
      invitation.acceptedAt = new Date().toISOString();

      this.emit('invitation-accepted', { invitation, collaborator });

      return {
        success: true,
        projectId: invitation.projectId,
        permissions: invitation.permissions
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Manage collaborator permissions
  async updateCollaboratorPermissions(email, newPermissions) {
    if (!this.collaborators.has(email)) {
      return { success: false, error: 'Collaborator not found' };
    }

    const collaborator = this.collaborators.get(email);
    collaborator.permissions = newPermissions;
    collaborator.lastModified = new Date().toISOString();

    this.collaborators.set(email, collaborator);
    await this.saveCollaborationData();

    this.emit('permissions-updated', { email, permissions: newPermissions });

    return { success: true };
  }

  async removeCollaborator(email) {
    if (!this.collaborators.has(email)) {
      return { success: false, error: 'Collaborator not found' };
    }

    this.collaborators.delete(email);
    await this.saveCollaborationData();

    this.emit('collaborator-removed', { email });

    return { success: true };
  }

  // Real-time synchronization
  async syncChanges(changes) {
    if (!this.isEnabled) return;

    // Add changes to buffer
    this.changeBuffer.push({
      timestamp: new Date().toISOString(),
      user: this.getCurrentUser(),
      changes
    });

    // Send to server if real-time sync is enabled
    if (this.config.enableRealTimeSync && this.wsConnection) {
      try {
        await this.sendChangesToServer(changes);
      } catch (error) {
        console.error('Failed to send real-time changes:', error);
        // Changes will be sent on next sync interval
      }
    }
  }

  // Periodic sync
  async performPeriodicSync() {
    if (!this.isEnabled || this.changeBuffer.length === 0) return;

    try {
      this.syncStatus = 'syncing';
      this.emit('sync-status-changed', 'syncing');

      // Send buffered changes
      await this.sendBufferedChanges();

      // Receive remote changes
      const remoteChanges = await this.fetchRemoteChanges();

      // Apply remote changes and check for conflicts
      await this.applyRemoteChanges(remoteChanges);

      this.syncStatus = 'connected';
      this.lastSync = new Date().toISOString();
      this.changeBuffer = [];

      this.emit('sync-completed', {
        timestamp: this.lastSync,
        changesSent: this.changeBuffer.length,
        changesReceived: remoteChanges.length
      });

    } catch (error) {
      this.syncStatus = 'error';
      this.emit('sync-error', error.message);
      console.error('Sync failed:', error);
    }

    this.emit('sync-status-changed', this.syncStatus);
  }

  // Conflict resolution
  async detectConflicts(remoteChanges) {
    const conflicts = [];

    for (const remoteChange of remoteChanges) {
      // Check if we have local changes for the same file/section
      const localChanges = this.changeBuffer.filter(change =>
        change.changes.some(c => c.file === remoteChange.file &&
                               this.hasOverlap(c.range, remoteChange.range))
      );

      if (localChanges.length > 0) {
        conflicts.push({
          id: this.generateConflictId(),
          file: remoteChange.file,
          localChanges,
          remoteChange,
          detected: new Date().toISOString(),
          status: 'pending'
        });
      }
    }

    return conflicts;
  }

  async resolveConflict(conflictId, resolution) {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) {
      return { success: false, error: 'Conflict not found' };
    }

    try {
      switch (resolution.type) {
        case 'accept-local':
          await this.applyLocalChanges(conflict);
          break;
        case 'accept-remote':
          await this.applyRemoteChanges([conflict.remoteChange]);
          break;
        case 'merge':
          await this.mergeChanges(conflict, resolution.mergedContent);
          break;
        default:
          throw new Error('Invalid resolution type');
      }

      conflict.status = 'resolved';
      conflict.resolvedAt = new Date().toISOString();
      conflict.resolution = resolution;

      this.conflicts.set(conflictId, conflict);
      this.emit('conflict-resolved', conflict);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Comments and annotations
  async addComment(fileId, position, text, isReply = false, parentId = null) {
    if (!this.config.enableComments) {
      return { success: false, error: 'Comments are disabled' };
    }

    const comment = {
      id: this.generateCommentId(),
      fileId,
      position,
      text,
      author: this.getCurrentUser(),
      created: new Date().toISOString(),
      isReply,
      parentId,
      resolved: false,
      replies: []
    };

    // Save comment locally
    await this.saveComment(comment);

    // Send to collaborators
    if (this.isEnabled) {
      await this.broadcastComment(comment);
    }

    this.emit('comment-added', comment);

    return { success: true, comment };
  }

  async resolveComment(commentId) {
    const comment = await this.getComment(commentId);
    if (!comment) {
      return { success: false, error: 'Comment not found' };
    }

    comment.resolved = true;
    comment.resolvedAt = new Date().toISOString();
    comment.resolvedBy = this.getCurrentUser();

    await this.saveComment(comment);

    if (this.isEnabled) {
      await this.broadcastCommentUpdate(comment);
    }

    this.emit('comment-resolved', comment);

    return { success: true };
  }

  // Version history
  async createVersion(description = '') {
    if (!this.config.enableVersionHistory) return;

    const version = {
      id: this.generateVersionId(),
      timestamp: new Date().toISOString(),
      author: this.getCurrentUser(),
      description,
      files: await this.captureProjectSnapshot()
    };

    const versionsPath = path.join(this.currentProject.path, '.collaboration', 'versions');
    await fs.ensureDir(versionsPath);

    await fs.writeFile(
      path.join(versionsPath, `${version.id}.json`),
      JSON.stringify(version, null, 2)
    );

    // Clean up old versions if needed
    await this.cleanupOldVersions();

    this.emit('version-created', version);

    return version;
  }

  async restoreVersion(versionId) {
    try {
      const versionsPath = path.join(this.currentProject.path, '.collaboration', 'versions');
      const versionFile = path.join(versionsPath, `${versionId}.json`);

      if (!await fs.pathExists(versionFile)) {
        throw new Error('Version not found');
      }

      const version = JSON.parse(await fs.readFile(versionFile, 'utf8'));

      // Create backup of current state
      await this.createVersion('Auto-backup before restore');

      // Restore files
      for (const [filePath, content] of Object.entries(version.files)) {
        const fullPath = path.join(this.currentProject.path, filePath);
        await fs.ensureDir(path.dirname(fullPath));
        await fs.writeFile(fullPath, content);
      }

      this.emit('version-restored', { versionId, timestamp: version.timestamp });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // WebSocket connection for real-time sync
  async connectToServer() {
    if (!this.config.enableRealTimeSync) return;

    try {
      const WebSocket = require('ws');
      this.wsConnection = new WebSocket(this.config.serverUrl);

      this.wsConnection.on('open', () => {
        this.syncStatus = 'connected';
        this.emit('sync-status-changed', 'connected');

        // Authenticate
        this.wsConnection.send(JSON.stringify({
          type: 'authenticate',
          projectId: this.currentProject.id,
          user: this.getCurrentUser()
        }));
      });

      this.wsConnection.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleServerMessage(message);
        } catch (error) {
          console.error('Error parsing server message:', error);
        }
      });

      this.wsConnection.on('close', () => {
        this.syncStatus = 'disconnected';
        this.emit('sync-status-changed', 'disconnected');

        // Attempt to reconnect after delay
        setTimeout(() => this.connectToServer(), 5000);
      });

      this.wsConnection.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.syncStatus = 'error';
        this.emit('sync-status-changed', 'error');
      });

    } catch (error) {
      console.error('Failed to connect to collaboration server:', error);
      this.syncStatus = 'error';
      this.emit('sync-status-changed', 'error');
    }
  }

  async disconnectFromServer() {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }

  handleServerMessage(message) {
    switch (message.type) {
      case 'changes':
        this.handleRemoteChanges(message.changes);
        break;
      case 'comment':
        this.handleRemoteComment(message.comment);
        break;
      case 'collaborator-joined':
        this.handleCollaboratorJoined(message.collaborator);
        break;
      case 'collaborator-left':
        this.handleCollaboratorLeft(message.collaborator);
        break;
      case 'sync-request':
        this.performPeriodicSync();
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  // Utility methods
  startSyncTimer() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.performPeriodicSync();
    }, this.config.syncIntervalMs);
  }

  stopSyncTimer() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  generateProjectId() {
    return crypto.randomBytes(16).toString('hex');
  }

  generateShareId() {
    return crypto.randomBytes(8).toString('hex');
  }

  generateInvitationId() {
    return crypto.randomBytes(12).toString('hex');
  }

  generateConflictId() {
    return crypto.randomBytes(8).toString('hex');
  }

  generateCommentId() {
    return crypto.randomBytes(8).toString('hex');
  }

  generateVersionId() {
    return Date.now().toString() + '-' + crypto.randomBytes(4).toString('hex');
  }

  getCurrentUser() {
    // Get current user from system or config
    return process.env.USER || process.env.USERNAME || 'unknown';
  }

  getDefaultExpiry() {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // 30 days
    return expiryDate.toISOString();
  }

  hasOverlap(range1, range2) {
    return range1.start < range2.end && range1.end > range2.start;
  }

  async captureProjectSnapshot() {
    const files = {};
    const projectFiles = await this.getProjectFiles();

    for (const filePath of projectFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const relativePath = path.relative(this.currentProject.path, filePath);
        files[relativePath] = content;
      } catch (error) {
        console.warn(`Could not capture file: ${filePath}`);
      }
    }

    return files;
  }

  async getProjectFiles() {
    const files = [];
    const extensions = ['.md', '.txt', '.json'];

    const scanDir = async (dir) => {
      const items = await fs.readdir(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stats = await fs.stat(fullPath);

        if (stats.isDirectory() && !item.startsWith('.')) {
          await scanDir(fullPath);
        } else if (stats.isFile() && extensions.includes(path.extname(item))) {
          files.push(fullPath);
        }
      }
    };

    await scanDir(this.currentProject.path);
    return files;
  }

  async cleanupOldVersions() {
    const versionsPath = path.join(this.currentProject.path, '.collaboration', 'versions');

    try {
      const versionFiles = await fs.readdir(versionsPath);

      if (versionFiles.length > this.config.maxVersionHistory) {
        // Sort by creation time and remove oldest
        const versions = [];

        for (const file of versionFiles) {
          const filePath = path.join(versionsPath, file);
          const stats = await fs.stat(filePath);
          versions.push({ file, mtime: stats.mtime });
        }

        versions.sort((a, b) => b.mtime - a.mtime);

        // Remove excess versions
        const toRemove = versions.slice(this.config.maxVersionHistory);
        for (const version of toRemove) {
          await fs.remove(path.join(versionsPath, version.file));
        }
      }
    } catch (error) {
      console.error('Error cleaning up old versions:', error);
    }
  }

  async loadCollaborationData() {
    try {
      const { app } = require('electron');
      const dataPath = path.join(app.getPath('userData'), 'collaboration-data.json');

      if (await fs.pathExists(dataPath)) {
        const data = JSON.parse(await fs.readFile(dataPath, 'utf8'));
        this.collaborators = new Map(data.collaborators || []);
        this.projectShares = new Map(data.projectShares || []);
        this.conflicts = new Map(data.conflicts || []);
      }
    } catch (error) {
      console.error('Error loading collaboration data:', error);
    }
  }

  async saveCollaborationData() {
    try {
      const { app } = require('electron');
      const dataPath = path.join(app.getPath('userData'), 'collaboration-data.json');

      const data = {
        collaborators: Array.from(this.collaborators.entries()),
        projectShares: Array.from(this.projectShares.entries()),
        conflicts: Array.from(this.conflicts.entries())
      };

      await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving collaboration data:', error);
    }
  }

  // Stub methods for server communication (to be implemented)
  async sendInvitation(invitation) {
    // Implementation depends on collaboration server
    console.log('Sending invitation:', invitation);
  }

  async getInvitation(invitationId) {
    // Implementation depends on collaboration server
    console.log('Getting invitation:', invitationId);
    return null;
  }

  async sendChangesToServer(changes) {
    if (this.wsConnection && this.wsConnection.readyState === 1) {
      this.wsConnection.send(JSON.stringify({
        type: 'changes',
        changes,
        timestamp: new Date().toISOString()
      }));
    }
  }

  async sendBufferedChanges() {
    // Send buffered changes to server
    console.log('Sending buffered changes:', this.changeBuffer.length);
  }

  async fetchRemoteChanges() {
    // Fetch changes from server
    return [];
  }

  async applyRemoteChanges(changes) {
    // Apply remote changes to local files
    for (const change of changes) {
      this.emit('remote-change-applied', change);
    }
  }

  async applyLocalChanges(conflict) {
    // Apply local changes, overriding remote
    console.log('Applying local changes for conflict:', conflict.id);
  }

  async mergeChanges(conflict, mergedContent) {
    // Apply merged content
    console.log('Applying merged changes for conflict:', conflict.id);
  }

  async saveComment(comment) {
    const commentsPath = path.join(this.currentProject.path, '.collaboration', 'comments');
    await fs.ensureDir(commentsPath);

    await fs.writeFile(
      path.join(commentsPath, `${comment.id}.json`),
      JSON.stringify(comment, null, 2)
    );
  }

  async getComment(commentId) {
    try {
      const commentPath = path.join(this.currentProject.path, '.collaboration', 'comments', `${commentId}.json`);
      return JSON.parse(await fs.readFile(commentPath, 'utf8'));
    } catch (error) {
      return null;
    }
  }

  async broadcastComment(comment) {
    if (this.wsConnection && this.wsConnection.readyState === 1) {
      this.wsConnection.send(JSON.stringify({
        type: 'comment',
        comment
      }));
    }
  }

  async broadcastCommentUpdate(comment) {
    if (this.wsConnection && this.wsConnection.readyState === 1) {
      this.wsConnection.send(JSON.stringify({
        type: 'comment-update',
        comment
      }));
    }
  }

  handleRemoteChanges(changes) {
    this.emit('remote-changes-received', changes);
  }

  handleRemoteComment(comment) {
    this.emit('remote-comment-received', comment);
  }

  handleCollaboratorJoined(collaborator) {
    this.emit('collaborator-joined', collaborator);
  }

  handleCollaboratorLeft(collaborator) {
    this.emit('collaborator-left', collaborator);
  }

  // Public API methods
  setCurrentProject(project) {
    this.currentProject = project;
  }

  getCollaborators() {
    return Array.from(this.collaborators.values());
  }

  getProjectShares() {
    return Array.from(this.projectShares.values());
  }

  getConflicts() {
    return Array.from(this.conflicts.values());
  }

  getSyncStatus() {
    return {
      status: this.syncStatus,
      lastSync: this.lastSync,
      pendingChanges: this.changeBuffer.length,
      isConnected: this.wsConnection && this.wsConnection.readyState === 1
    };
  }

  getConfig() {
    return { ...this.config };
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

module.exports = new CollaborationManager();
