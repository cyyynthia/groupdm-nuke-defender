/*
 * Copyright (c) 2021 Cynthia K. Rey, All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

const { Plugin } = require('powercord/entities');
const { React, FluxDispatcher, getModule, constants: { RelationshipTypes } } = require('powercord/webpack');
const { open, close } = require('powercord/modal');
const ThreatModal = require('./ThreatModal');

const RelationshipManager = getModule([ 'addRelationship' ], false)
const PrivateChannelsManager = getModule([ 'closePrivateChannel' ], false)

class GroupDmNukeDefender extends Plugin {
  constructor () {
    super()

    this.recentAdds = new Map()
    this.messageQueued = new Set()
    this.handleChannelCreate = this.handleChannelCreate.bind(this)
    this.handleMessageCreate = this.handleMessageCreate.bind(this)
  }

  startPlugin () {
    open(() => React.createElement(ThreatModal, { user: 'haxxor#1337', onClose: () => close() }))
    FluxDispatcher.subscribe('CHANNEL_CREATE', this.handleChannelCreate)
    FluxDispatcher.subscribe('MESSAGE_CREATE', this.handleMessageCreate)
  }

  pluginWillUnload () {
    FluxDispatcher.unsubscribe('CHANNEL_CREATE', this.handleChannelCreate)
    FluxDispatcher.unsubscribe('MESSAGE_CREATE', this.handleMessageCreate)
  }

  handleChannelCreate ({ channel: { id, type } }) {
    if (type === 3) {
      this.messageQueued.add(id)
    }
  }

  handleMessageCreate ({ channelId, message: { type, author: { id, username, discriminator } } }) {
    if (type === 1 && this.messageQueued.has(channelId)) {
      this.messageQueued.delete(channelId)
      if (!this.recentAdds.has(id)) {
        this.recentAdds.set(id, new Set())
      }

      const addedSet = this.recentAdds.get(id)
      addedSet.add(channelId)

      if (addedSet.size === 5) { // Strict equal, so if there are more groups we get added to we don't do it multiple times
        open(() => React.createElement(ThreatModal, { user: `${username}#${discriminator}`, onClose: () => close() }))
        RelationshipManager.addRelationship(id, { location: 'ContextMenu' }, RelationshipTypes.BLOCKED)
          .then(() => {
            // Leave groups
            for (const spamChannelId of Array.from(addedSet)) {
              setTimeout(() => void PrivateChannelsManager.closePrivateChannel(spamChannelId), 1e3 + (1500 * i))
            }

            // This is no longer necessary
            this.recentAdds.delete(id)
          })
      }

      // Expire after 30 seconds
      setTimeout(() => {
        addedSet.delete(channelId)
        if (addedSet.size === 0) {
          this.recentAdds.delete(id)
        }
      }, 30e3)
    }
  }
}

module.exports = GroupDmNukeDefender
