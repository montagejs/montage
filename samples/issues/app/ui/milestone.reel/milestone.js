/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */


var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.Milestone = Montage.create(Component, {
    api: {
        value: null
    },

    repo: {
        value: null
    },

    users: {
        value: null
    },

    activeUsers: {
        value: {},
        distinct: true
    },

    userList: {
        value: [],
        distinct: true
    },

    issues: {
        value: [],
        distinct: true
    },

    unassignedIssues: {
        value: [],
        distinct: true
    },

    data: {
        value: null
    },

    milestoneUrl: {
        get: function() {
            return "https://github.com/" + this.repo.user + "/" + this.repo.repo + "/issues?milestone=" + this.data.number;
        }
    },

    prepareForDraw: {
        value: function() {
            var self = this;

            // Query issues for this milestone
            this.repo.issues({
                milestone: this.data.number,
                per_page: this.data.open_issues
            }, function(response) {
                var issues = response.data;
                var i = 0;

                self.issues = issues;

                // Loop through all the issues and assign them to the appropriate users
                // Not sure if this is the best way to do this, but it beats making a ton of separate issues calls for each user
                // Also not sure how to make this more generalized
                for(i in issues) {
                    self.processIssue(issues[i]);
                }
            });
        }
    },

    processIssue: {
        value: function(issue) {
            if(!issue.assignee) {
                // If the issue has no assignee add it to a special group
                this.unassignedIssues.push(issue);
                return;
            }

            var assigneeLogin = issue.assignee.login;
            var assignee;

            if(!this.activeUsers[assigneeLogin]) {
                // This bit is a little awkward:
                // If we try to create a user component for every user associated with the repo it takes forever to load
                // Thus we skim through the issues list and add users to the "active users" set if they actually have issues
                // This also gives us an opportunity to copy the user object, since we need to have different ones in
                // memory for each milestone (prevents repeated issues)
                this.activeUsers[assigneeLogin] = JSON.parse(JSON.stringify(this.users[assigneeLogin])); // OH MY NO! WORST COPY EVAR!
                assignee = this.activeUsers[assigneeLogin];
                assignee.issues = [];
                this.userList.push(assignee);
            } else {
                assignee = this.activeUsers[assigneeLogin];
            }

            assignee.issues.push(issue);
        }
    }
});