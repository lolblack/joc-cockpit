/**
 * Created by sourabhagrawal on 29/06/16.
 */
(function () {
    'use strict';
    angular
        .module('app')
        .controller('ResourceCtrl', ResourceCtrl)
        .controller('ScheduleOrderCtrl', ScheduleOrderCtrl)
        .controller('DashboardCtrl', DashboardCtrl)
        .controller('DailyPlanCtrl', DailyPlanCtrl);


    ResourceCtrl.$inject = ["$scope", "$rootScope", 'JobSchedulerService', "ResourceService", "orderByFilter", "gettextCatalog", "ScheduleService", "$interval", "$uibModal"];
    function ResourceCtrl($scope, $rootScope, JobSchedulerService, ResourceService, orderBy, gettextCatalog, ScheduleService, $interval, $uibModal) {
        var vm = $scope;
        vm.filter = {};
        vm.filter.state = "all";
        vm.filter.sortBy = "name";

        vm.object = {};
        vm.pageSize = 10;
        vm.currentPage = 1;

        vm.sortBy = function (propertyName) {
            vm.reverse = (propertyName !== null && vm.propertyName === propertyName) ? !vm.reverse : false;
            vm.propertyName = propertyName;
            if (vm.state = 'agent') {
                vm.tree_data = orderBy(vm.tree_data, vm.propertyName, vm.reverse);
            }
            else if (vm.state = 'locks') {
                vm.locks = orderBy(vm.locks, vm.propertyName, vm.reverse);
            } else if (vm.state = 'processClass') {
                vm.processClasses = orderBy(vm.processClasses, vm.propertyName, vm.reverse);
            } else {
                vm.object.schedules = [];
                vm.schedules = orderBy(vm.schedules, vm.propertyName, vm.reverse);
            }
        };

        vm.mainSortBy = function (propertyName) {
            vm.sortReverse = !vm.sortReverse;
            vm.filter.sortBy = propertyName;
            if (vm.state == 'agent')
                vm.tree_data = orderBy(vm.tree_data, vm.filter.sortBy, vm.sortReverse);
            else if (vm.state == 'locks') {
                vm.locks = orderBy(vm.locks, vm.filter.sortBy, vm.sortReverse);
            } else if (vm.state == 'processClass') {
                vm.processClasses = orderBy(vm.processClasses, vm.filter.sortBy, vm.sortReverse);
            } else {
                vm.object.schedules = [];
                vm.schedules = orderBy(vm.schedules, vm.filter.sortBy, vm.sortReverse);
            }
        };

        /** -----------------Begin Agent clusters------------------- */
        vm.tree_data = [];

        vm.expanding_property = {
            field: "AgentClusterName",
            displayName: gettextCatalog.getString('label.agentClusterName'),
            sortable: true,
            filterable: true,
            cellTemplate: "<span>{{row.branch[expandingProperty.field].substring(row.branch[expandingProperty.field].lastIndexOf('/')+1,row.branch[expandingProperty.field].lastIndexOf('&'))}}</span>"
        };
        vm.col_defs = [
            {
                field: "Status",
                displayName: gettextCatalog.getString('label.status'),
                sortable: true,
                cellTemplate: "<span class='label b-{{row.branch[col.field]}}'>{{ row.branch[col.field] | translate}}</span>"
            },
            {
                field: "URL",
                displayName: gettextCatalog.getString('label.url'),
                sortable: true
            },
            {
                field: "TotalAgents",
                displayName: gettextCatalog.getString('label.totalAgents'),
                sortable: true,
                sortingType: "number"
            },
            {
                field: "RunningAgent",
                displayName: gettextCatalog.getString('label.runningAgent'),
                sortable: true,
                sortingType: "number"
            },
            {
                field: "NotReachable",
                displayName: gettextCatalog.getString('label.notReachable'),
                sortable: true,
                sortingType: "number"
            }, {
                field: "SchedulingType",
                displayName: gettextCatalog.getString('label.schedulingType'),
                sortable: true,
                cellTemplate: "<span >{{ row.branch[col.field] | translate }}</span>"
            },
            {
                field: "LastUpdateTime",
                displayName: gettextCatalog.getString('label.lastUpdateTime'),
                sortable: true,
                cellTemplate: "<span class='text-muted'>{{ row.branch[col.field] | stringToDate }}</span>"
            },
            {
                field: "MaxProcess",
                displayName: gettextCatalog.getString('label.maxProcess'),
                sortable: true,
                sortingType: "number"
            },
            {
                field: "RunningTasks",
                displayName: gettextCatalog.getString('label.runningTasks'),
                sortable: true,
                sortingType: "number"
            }
        ];

        function prepareDataForTreeWithPermanent(res) {
            var agentsData = [];
            angular.forEach(res, function (value) {

                var clusterObj = {
                    "AgentClusterName": value.path + '&' + (value.state._text === "all_agents_are_running" ? "healthy" : value.state._text === "only_some_agents_are_running" ? "unhealthy" : "unreachable"),
                    "Status": value.state._text === "all_agents_are_running" ? "healthy" : value.state._text === "only_some_agents_are_running" ? "unhealthy" : "unreachable",
                    "URL": '-',
                    "TotalAgents": value.numOfAgents.any,
                    "RunningAgent": value.numOfAgents.running,
                    "NotReachable": value.numOfAgents.any - value.numOfAgents.running,
                    "SchedulingType": value._type,
                    "LastUpdateTime": value.surveyDate,
                    "MaxProcess": value.maxProcesses,
                    "RunningTasks": 0,
                    "children": []
                };

                angular.forEach(value.agents, function (agent, index1) {
                    if (value.agents[index1].runningTasks)
                        clusterObj.RunningTasks = clusterObj.RunningTasks + value.agents[index1].runningTasks;

                    var agentObj = {
                        "AgentClusterName": agent.host + '&' + (value.agents[index1].state._text === "running" ? "healthy" : "unreachable"),
                        "Status": value.agents[index1].state._text === "running" ? "healthy" : "unreachable",
                        "URL": value.agents[index1].url,
                        "TotalAgents": "-",
                        "RunningAgent": "-",
                        "NotReachable": "-",
                        "SchedulingType": "-",
                        "LastUpdateTime": value.agents[index1].surveyDate,
                        "MaxProcess": "-",
                        "RunningTasks": value.agents[index1].runningTasks
                    };
                    clusterObj.children.push(agentObj);
                });

                agentsData.push(clusterObj);

            });
            return agentsData;
        }

        function prepareDataForTreegrid(res, result) {
            var agentsData = [];
            angular.forEach(res, function (value, index) {

                var clusterObj = {
                    "AgentClusterName": value.path + '&' + (result[index].state._text === "all_agents_are_running" ? "healthy" : result[index].state._text === "only_some_agents_are_running" ? "unhealthy" : "unreachable"),
                    "Status": result[index].state._text === "all_agents_are_running" ? "healthy" : result[index].state._text === "only_some_agents_are_running" ? "unhealthy" : "unreachable",
                    "URL": '-',
                    "TotalAgents": result[index].numOfAgents.any,
                    "RunningAgent": result[index].numOfAgents.running,
                    "NotReachable": result[index].numOfAgents.any - result[index].numOfAgents.running,
                    "SchedulingType": value._type,
                    "LastUpdateTime": result[index].surveyDate,
                    "MaxProcess": value.maxProcesses,
                    "RunningTasks": 0,
                    "children": []
                };

                angular.forEach(value.agents, function (agent, index1) {
                    if (result[index].agents[index1].runningTasks)
                        clusterObj.RunningTasks = clusterObj.RunningTasks + result[index].agents[index1].runningTasks;

                    var agentObj = {
                        "AgentClusterName": agent.host + '&' + (result[index].agents[index1].state._text === "running" ? "healthy" : "unreachable"),
                        "Status": result[index].agents[index1].state._text === "running" ? "healthy" : "unreachable",
                        "URL": result[index].agents[index1].url,
                        "TotalAgents": "-",
                        "RunningAgent": "-",
                        "NotReachable": "-",
                        "SchedulingType": "-",
                        "LastUpdateTime": result[index].agents[index1].surveyDate,
                        "MaxProcess": "-",
                        "RunningTasks": result[index].agents[index1].runningTasks
                    };
                    clusterObj.children.push(agentObj);
                });

                agentsData.push(clusterObj);

            });
            return agentsData;
        }

        vm.loadAgents = function () {
            var obj = {};
            obj.jobschedulerId = $scope.schedulerIds.selected;
            obj.compact = true;

            if (vm.filter.state != 'all') {
                obj.state = vm.filter.state == '0' ? 0 : vm.filter.state == '1' ? 1 : 2;
            }

            JobSchedulerService.getAgentClusterP(obj).then(function (res) {
                vm.temp = res.agentClusters;
                vm.tree_data = prepareDataForTreeWithPermanent(res.agentClusters);
                vm.isLoading = true;
                loadAgentsV();
            }, function () {
                vm.isLoading = true;
                vm.isError = true;
            });
        };

        function loadAgentsV() {
            var obj = {};
            obj.jobschedulerId = $scope.schedulerIds.selected;
            obj.compact = true;

            if (vm.filter.state != 'all') {
                obj.state = vm.filter.state == '0' ? 0 : vm.filter.state == '1' ? 1 : 2;
            }
            JobSchedulerService.getAgentCluster(obj).then(function (result) {
                vm.tree_data = prepareDataForTreegrid(vm.temp, result.agentClusters);
            });
        }

        /** <<<<<<<<<<<<< End Agent clusters >>>>>>>>>>>>>>> */

        /** -----------------Begin Locks------------------- */

        vm.loadLocks = function () {
            vm.isLoading = false;
            ResourceService.getLocksP({jobschedulerId: $scope.schedulerIds.selected}).then(function (result) {
                vm.locks = result.locks;
                vm.isLoading = true;
                loadLocksV();
            }, function () {
                vm.isLoading = true;
                vm.isError = true;
            });
        };

        function loadLocksV() {
            ResourceService.get({jobschedulerId: $scope.schedulerIds.selected}).then(function (result) {
                vm.locks = angular.merge(vm.locks, result.locks);
            });
        }

        /** <<<<<<<<<<<<< End Locks >>>>>>>>>>>>>>> */

        /** -----------------Begin ProcessClass------------------- */

        vm.loadProcessClass = function () {
            vm.isLoading = false;
            ResourceService.getProcessClassP({jobschedulerId: $scope.schedulerIds.selected}).then(function (result) {
                vm.processClasses = result.processClasses;
                vm.isLoading = true;
                loadProcessClassV();
            }, function () {
                vm.isLoading = true;
                vm.isError = true;
            });
        };

        function loadProcessClassV() {
            ResourceService.getProcessClass({
                jobschedulerId: $scope.schedulerIds.selected
            }).then(function (result) {
                vm.processClasses = angular.merge(vm.processClasses, result.processClasses);
            });
        }

        /** <<<<<<<<<<<<< End ProcessClass >>>>>>>>>>>>>>> */

        /** -----------------Begin Schedules------------------- */
        vm.loadSchedules = function () {
            vm.isLoading = false;
            ScheduleService.getSchedulesP({jobschedulerId: $scope.schedulerIds.selected}).then(function (result) {
                vm.schedules = result.schedules;
                vm.isLoading = true;
                loadSchedulesV();
            }, function () {
                vm.isLoading = true;
                vm.isError = true;
            });
        };

        function loadSchedulesV() {
            var obj = {};
            obj.jobschedulerId = $scope.schedulerIds.selected;

            if (vm.filter.state != 'all') {
                obj.state = vm.filter.state;
            }
            ScheduleService.get(obj).then(function (result) {
                vm.schedules = angular.merge(vm.schedules, result.schedules);
            });
        }

        vm.allCheck = {
            checkbox: false
        };

        var watcher1 = $scope.$watchCollection('object.schedules', function (newNames) {
            if (newNames && newNames.length > 0) {
                vm.allCheck.checkbox = newNames.length == vm.schedules.slice((vm.pageSize * (vm.currentPage - 1)), (vm.pageSize * vm.currentPage)).length;
            } else {
                vm.allCheck.checkbox = false;
            }
        });

        var watcher2 = $scope.$watchCollection('filtered', function (newNames) {
            if (newNames)
                vm.object.schedules = [];
        });


        var watcher3 = $scope.$watch('pageSize', function (newNames) {
            if (newNames)
                vm.object.schedules = [];
        });

        vm.checkAll = function () {
            if (vm.allCheck.checkbox) {
                vm.object.schedules = vm.schedules.slice((vm.pageSize * (vm.currentPage - 1)), (vm.pageSize * vm.currentPage));
            } else {
                vm.object.schedules = [];
            }
        };

        function substitute(schedule) {
            ScheduleService.substitute(schedule, $scope.schedulerIds.selected).then(function (res) {

            });
        }

        vm.substitute = function (schedule) {
            vm.sch = {};
            vm.sch.folder = '/';

            vm.sch._valid_from = moment().set({
                hour: 0,
                minute: 0,
                second: 0,
                millisecond: 0
            }).format('YYYY-MM-DD HH:mm:ss');
            vm.sch._valid_to = moment().set({
                hour: 23,
                minute: 59,
                second: 59,
                millisecond: 0
            }).format('YYYY-MM-DD HH:mm:ss');
            vm.sch._substitute = schedule.path;
            vm.schedule = schedule;

            var modalInstance = $uibModal.open({
                templateUrl: 'modules/core/template/add-substitute-dialog.html',
                controller: 'RuntimeEditorDialogCtrl',
                scope: vm,
                size: 'lg',
                backdrop: 'static'
            });
            modalInstance.result.then(function () {
                substitute(schedule);
            }, function () {

            });
            ScheduleService.getRunTime({
                jobschedulerId: $scope.schedulerIds.selected,
                schedule: schedule.path
            }).then(function (res) {
                if (res.runTime) {
                    vm.runTimes = res.runTime;
                    vm.runTimes.content = vm.runTimes.content.replace(/&lt;/g, '<');
                    vm.runTimes.content = vm.runTimes.content.replace(/&gt;/g, '>');
                    vm.xml = vm.runTimes.content;
                }
                $rootScope.$broadcast('loadXml');

            });
            vm.zones = moment.tz.names();
        };

        vm.substituteAll = function () {

            var modalInstance = $uibModal.open({
                templateUrl: 'modules/core/template/substitute-all-dialog.html',
                controller: 'DialogCtrl',
                scope: vm,
                backdrop: 'static'
            });
            modalInstance.result.then(function () {
                angular.forEach(vm.object.schedules, function (value) {
                    substitute(value);
                });
            }, function () {
                vm.object.schedules = [];
            });
        };

        vm.reset = function () {
            vm.object.schedules = [];
        };

        vm.setRunTime = function (schedule) {
            var schedules = {};
            schedules.jobschedulerId = $scope.schedulerIds.selected;
            schedules.schedule = schedule.path;
            schedules.runTime = schedule.runTime;
            ScheduleService.setRunTime(schedules).then(function (result) {
                vm.schedules = result.schedules;
            }, function () {
                vm.isError = true;
            });

        };

        vm.editSchedule = function (schedule) {

            vm.sch = {};
            vm.schedule = schedule;
            vm.sch._title = schedule.title;
            var modalInstance = $uibModal.open({
                templateUrl: 'modules/core/template/edit-schedule-dialog.html',
                controller: 'RuntimeEditorDialogCtrl',
                scope: vm,
                size: 'lg',
                backdrop: 'static'
            });
            modalInstance.result.then(function () {

                setRunTime(schedule);
            }, function () {
                vm.object.schedules = [];
            });
            ScheduleService.getRunTime({
                jobschedulerId: $scope.schedulerIds.selected,
                schedule: schedule.path
            }).then(function (res) {
                if (res.runTime) {
                    vm.runTimes = res.runTime;
                    vm.runTimes.content = vm.runTimes.content.replace(/&lt;/g, '<');
                    vm.runTimes.content = vm.runTimes.content.replace(/&gt;/g, '>');
                    vm.xml = vm.runTimes.content;
                }
                $rootScope.$broadcast('loadXml');

            });
            vm.zones = moment.tz.names();
        };

        /** -----------------End Schedules------------------- */


        $scope.$on('$stateChangeSuccess', function (event, toState, toParams) {
            vm.state = '';

            if (toState.name == 'app.resources.agentClusters') {
                vm.state = 'agent';
                if (toParams.type)
                    vm.filter.state = toParams.type == 'healthy' ? '0' : toParams.type == 'unhealthy' ? '1' : '2';
                else
                    vm.filter.state = 'all';

                if (!vm.temp) {
                    vm.loadAgents();
                }
            } else if (toState.name == 'app.resources.locks') {
                vm.state = 'lock';
                if (!vm.locks)
                    vm.loadLocks();
            } else if (toState.name == 'app.resources.processClasses') {
                vm.state = 'processClass';
                if (!vm.processClasses)
                    vm.loadProcessClass();
            } else {
                vm.state = 'schedules';
                vm.filter.state = vm.filter.state == 'ACTIVE' ? 'ACTIVE' : vm.filter.state == 'INACTIVE' ? 'INACTIVE' : 'all';
                if (!vm.schedules)
                    vm.loadSchedules();
            }
            startPolling();
        });


        var interval1, interval2, interval3, interval4;

        function poll1() {
            interval1 = $interval(function () {
                loadAgentsV();
            }, $rootScope.config.agentCluster.interval * 1000)
        }

        function poll2() {
            interval2 = $interval(function () {
                loadLocksV();
            }, $rootScope.config.locks.interval * 1000)
        }

        function poll3() {
            interval3 = $interval(function () {
                loadProcessClassV();
            }, $rootScope.config.processClass.interval * 1000)
        }

        function poll4() {
            interval4 = $interval(function () {
                loadSchedulesV();
            }, $rootScope.config.schedules.interval * 1000)
        }

        function startPolling() {
            $interval.cancel(interval1);
            $interval.cancel(interval2);
            $interval.cancel(interval3);
            $interval.cancel(interval4);
            if (vm.state == 'agent') {
                if ($rootScope.config.agentCluster.polling)
                    poll1();
            } else if (vm.state == 'lock') {
                if ($rootScope.config.locks.polling)
                    poll2();
            } else if (vm.state == 'processClass') {
                if ($rootScope.config.processClass.polling)
                    poll3();
            } else {
                if ($rootScope.config.schedules.polling)
                    poll4();
            }
        }

        $scope.$on('$destroy', function () {
            watcher1();
            watcher2();
            watcher3();
            $interval.cancel(interval1);
            $interval.cancel(interval2);
            $interval.cancel(interval3);
            $interval.cancel(interval4);

        });
    }


    ScheduleOrderCtrl.$inject = ["$scope", "$rootScope", "ScheduleService", "$stateParams", "$location", "OrderService", "$uibModal", "orderByFilter"];
    function ScheduleOrderCtrl($scope, $rootScope, ScheduleService, $stateParams, $location, OrderService, $uibModal, orderBy) {
        var vm = $scope;
        vm.name = $stateParams.name;
        var object = $location.search();

        vm.path = object.path;

        vm.filter = {};
        vm.filter.sortBy = "status";
        vm.isLoading = false;
        vm.object = {};

        /**--------------- sorting and pagination -------------------*/
        vm.sortBy = function (propertyName) {
            vm.object.orders = [];
            vm.reverse = (propertyName !== null && vm.propertyName === propertyName) ? !vm.reverse : false;
            vm.propertyName = propertyName;
            vm.orders = orderBy(vm.orders, vm.propertyName, vm.reverse);
        };

        vm.orders = [];
        function loadOrders(orders) {
            OrderService.getOrdersP({
                jobschedulerId: $scope.schedulerIds.selected,
                compact: true,
                orders: orders
            }).then(function (result) {
                vm.orders = result.orders;
                vm.isLoading = true;
                OrderService.get({
                    jobschedulerId: $scope.schedulerIds.selected,
                    orders: orders,
                    compact: true
                }).then(function (res) {
                    vm.orders = angular.merge(result.orders, res.orders);
                });
            }, function () {

                vm.isError = true;
            });
        }

        vm.showPanel = '';
        vm.showPanelFuc = function (value) {
            vm.showPanel = value;
            vm.hidePanel = !vm.hidePanel;
        };
        vm.hidePanelFuc = function () {
            vm.showPanel = '';
            vm.hidePanel = !vm.hidePanel;
        };

        ScheduleService.getScheduleP(vm.path, $scope.schedulerIds.selected).then(function (result) {
            vm.schedule = result.schedule;
            vm.isLoading = true;
            ScheduleService.getSchedule(vm.path, $scope.schedulerIds.selected).then(function (result) {
                vm.schedule = angular.merge(vm.schedule, result.schedule);
            });
            if(vm.schedule.usedByOrders && vm.schedule.usedByOrders.length>0)
            loadOrders(vm.schedule.usedByOrders);
        }, function () {
            vm.isLoading = true;
            vm.isError = true;
        });

        vm.editSchedule = function () {

            vm.sch = {};

            vm.sch._title = vm.schedule.title;
            var modalInstance = $uibModal.open({
                templateUrl: 'modules/core/template/edit-schedule-dialog.html',
                controller: 'RuntimeEditorDialogCtrl',
                scope: vm,
                size: 'lg',
                backdrop: 'static'
            });
            modalInstance.result.then(function () {

                setRunTime(schedule);
            }, function () {
                vm.object.schedules = [];
            });
            ScheduleService.getRunTime({
                jobschedulerId: $scope.schedulerIds.selected,
                schedule: schedule.path
            }).then(function (res) {
                if (res.runTime) {
                    vm.runTimes = res.runTime;
                    vm.runTimes.content = vm.runTimes.content.replace(/&lt;/g, '<');
                    vm.runTimes.content = vm.runTimes.content.replace(/&gt;/g, '>');
                    vm.xml = vm.runTimes.content;
                }
                $rootScope.$broadcast('loadXml');

            });
            vm.zones = moment.tz.names();
        };

        vm.substitute = function () {
            vm.sch = {};
            vm.sch.folder = '/';

            vm.sch._valid_from = moment().set({
                hour: 0,
                minute: 0,
                second: 0,
                millisecond: 0
            }).format('YYYY-MM-DD HH:mm:ss');
            vm.sch._valid_to = moment().set({
                hour: 23,
                minute: 59,
                second: 59,
                millisecond: 0
            }).format('YYYY-MM-DD HH:mm:ss');
            vm.sch._substitute = vm.schedule.path;


            //console.log(schedule);
            var modalInstance = $uibModal.open({
                templateUrl: 'modules/core/template/add-substitute-dialog.html',
                controller: 'RuntimeEditorDialogCtrl',
                scope: vm,
                size: 'lg',
                backdrop: 'static'
            });
            modalInstance.result.then(function () {

            }, function () {

            });
            ScheduleService.getRunTime({
                jobschedulerId: $scope.schedulerIds.selected,
                schedule: vm.schedule.path
            }).then(function (res) {
                if (res.runTime) {
                    vm.runTimes = res.runTime;
                    vm.runTimes.content = vm.runTimes.content.replace(/&lt;/g, '<');
                    vm.runTimes.content = vm.runTimes.content.replace(/&gt;/g, '>');
                    vm.xml = vm.runTimes.content;
                }
                $rootScope.$broadcast('loadXml');

            });
            vm.zones = moment.tz.names();
        };
    }

    DashboardCtrl.$inject = ['$scope', 'OrderService', 'JobSchedulerService', '$interval', '$state', '$uibModal', 'DailyPlanService', 'moment', '$rootScope'];
    function DashboardCtrl($scope, OrderService, JobSchedulerService, $interval, $state, $uibModal, DailyPlanService, moment, $rootScope) {
        var vm = $scope;
        var bgColorArray = [];


        function groupBy(data) {
            var results = [];
            if (!(data)) return;

            angular.forEach(data, function (value) {
                var result = {};

                result.numOfAgents = value.numOfAgents.any;
                if (value.state._text.toLowerCase() == "all_agents_are_running") {

                    result._text = "label.healthyAgentCluster";
                } else if (value.state._text.toLowerCase() == "all_agents_are_unreachable") {
                    result._text = "label.unreachableAgentCluster";
                } else {
                    result._text = "label.unhealthyAgentCluster";
                }

                if (results.length > 0) {
                    for (var i = 0; i < results.length; i++) {
                        if (results[i]._text == result._text) {
                            result.numOfAgents = results[i].numOfAgents + value.numOfAgents.any;
                            results.splice(i, 1);
                            break;
                        }
                    }
                }
                results.push(result);

            });
            return results;
        }


        vm.getAgentCluster = function () {
            JobSchedulerService.getAgentClusterP({
                jobschedulerId: $scope.schedulerIds.selected,
                compact: true
            }).then(function (result) {
                // prepareAgentClusterData(result.agentClusters)

                JobSchedulerService.getAgentCluster({
                    jobschedulerId: $scope.schedulerIds.selected,
                    compact: true
                }).then(function (res) {
                    // angular.merge(res.agentClusters,result.agentClusters);
                    prepareAgentClusterData(res.agentClusters);

                });
            }, function (err) {

            });
        };

        function prepareAgentClusterData(result) {

            vm.agentClusters = result;
            var agentArray = [];
            var agentArray1 = [];
            vm.YAxisDomain = [0, 3];
            //vm.YAxisDomain[0] = 0;

            angular.forEach(result, function (value) {
                var numTask = 0;
                angular.forEach(value.agents, function (value1) {
                    if (value1.runningTasks)
                        numTask = numTask + value1.runningTasks;
                });
                agentArray.push([value.path.substring(value.path.lastIndexOf('/') + 1), numTask]);
            });
            angular.forEach(groupBy(result), function (value) {

                if (value._text == "label.healthyAgentCluster") {
                    bgColorArray.push('#7ab97a');
                } else if (value._text == "label.unreachableAgentCluster") {
                    bgColorArray.push('#e86680');
                } else {
                    bgColorArray.push('rgba(255, 195, 0, 0.9)');
                }
                agentArray1.push({
                    key: value._text,
                    y: value.numOfAgents
                });
            });

            vm.agentClusterData = agentArray1;

            vm.agentStatusChart = [
                {
                    "key": "Agents",
                    "values": agentArray
                }
            ];
        }


        vm.xFunction = function () {
            return function (d) {
                return d.key;
            };
        };
        vm.yFunction = function () {
            return function (d) {
                return d.y;
            };
        };

        vm.yAxisTickFormatFunction = function () {
            return function (d) {
                return d3.format(',f')(d);
            };
        };
        vm.descriptionFunction = function () {
            return function (d) {
                return d.key;
            }
        };


        var format = d3.format(',.0f');
        vm.valueFormatFunction = function () {
            return function (d) {
                return format(d);
            }
        };

        vm.colorFunction = function () {
            return function (d, i) {
                return bgColorArray[i];
            };
        };

        var cluster = 'passive';
        var scenario = 'From mock API';

        prepareClusterStatusData();
        var clusterStatusData = {};


        function prepareClusterStatusData() {
            clusterStatusData = {};
            getDatabase().then(function (res) {
                clusterStatusData.database = res;
                getClusterMembersP().then(function (res) {
                    angular.forEach(res.masters, function (master, index) {
                        if (index == res.masters.length - 1) {
                            //console.log("Now refresh");
                            clusterStatusData.members = res;
                            vm.clusterStatusData = clusterStatusData;
                        }
                    })

                }, function (err) {

                })
            }, function (err) {

            })
        }


        vm.getSupervisor = getSupervisorDetails;
        function getSupervisorDetails() {

            return JobSchedulerService.getSupervisorP({jobschedulerId: $scope.schedulerIds.selected});
        }


        vm.getClusterMembers = getClusterMembers;
        function getClusterMembers() {
            return JobSchedulerService.getClusterMembers({jobschedulerId: $scope.schedulerIds.selected});
        }


        determineClusterStatus();
        function determineClusterStatus() {
            vm.clusterStatus = 'stopped';
            vm.getClusterMembers().then(function (res) {
                angular.forEach(res.masters, function (master, index) {
                    if (master.state._text == 'RUNNING') {
                        vm.clusterStatus = 'running';
                    }
                })
            }, function (err) {

            })
        }

        function getDatabase() {

            return JobSchedulerService.getDatabase({jobschedulerId: $scope.schedulerIds.selected});
        }

        function getClusterMembersP() {

            return JobSchedulerService.getClusterMembersP({jobschedulerId: $scope.schedulerIds.selected});
        }


        vm.loadOrderSnapshot = function () {
            OrderService.getSnapshot({jobschedulerId: $scope.schedulerIds.selected}).then(function (res) {
                vm.snapshot = res.orders;
            });
        };


        $scope.$on('elementClick.directive', function (angularEvent, event) {
            var key = '';
            if (event.label) {
                if (event.label == "label.healthyAgentCluster") {
                    key = 'healthy';
                } else if (event.label == "label.unhealthyAgentCluster") {
                    key = 'unhealthy';
                } else {
                    key = 'unreachable';
                }
            } else {
                angular.forEach(vm.agentClusters, function (value) {
                    if (event.point[0] == value.path.substring(value.path.lastIndexOf('/') + 1)) {

                        if (value.state._text.toLowerCase() == "label.healthyAgentCluster") {
                            key = 'healthy';
                        } else if (value.state._text.toLowerCase() == "label.unhealthyAgentCluster") {
                            key = 'unhealthy';
                        } else {
                            key = 'unreachable';
                        }

                    }
                });
            }
            $state.go('app.resources.agentClusters', {type: key});

        });

        vm.setLabel = function (label) {
            var key = '';
            if (label == "label.healthyAgentCluster") {
                key = 'healthy';
            } else if (label == "label.unhealthyAgentCluster") {
                key = 'unhealthy';
            } else {
                key = 'unreachable';
            }

            $state.go('app.resources.agentClusters', {type: key});
        };

        vm.viewAllAgents = function () {
            $state.go('app.resources.agentClusters');
        };

        // vm.loadOrderSummary(vm.summaryFilter.dateFrom);
        vm.loadOrderSnapshot();
        vm.getAgentCluster();
        //vm.getAgentClusterP();
        var states = [];
        vm.clusterAction = function (objectType, action, host, port) {
            //console.log("objectType " + objectType + " action " + action + " object " + host + port);
            if ((objectType == 'supervisor' || objectType == 'master') && action == 'terminate') {
                JobSchedulerService.terminate(host, port, $scope.schedulerIds.selected).then(function (res) {
                    success('stopped', host, port);
                }, function (err) {

                });
            } else if ((objectType == 'supervisor' || objectType == 'master') && action == 'restart') {
                JobSchedulerService.restart(host, port, $scope.schedulerIds.selected).then(function (res) {
                    success('running', host, port);
                }, function (err) {

                });
            } else if ((objectType == 'supervisor' || objectType == 'master') && action == 'abortAndRestart') {
                JobSchedulerService.abortAndRestart(host, port, $scope.schedulerIds.selected).then(function (res) {
                    success('running', host, port);
                }, function (err) {

                });

            } else if ((objectType == 'supervisor' || objectType == 'master') && action == 'terminateAndRestart') {
                JobSchedulerService.terminate(host, port, $scope.schedulerIds.selected).then(function (res) {
                    JobSchedulerService.restart(host, port, $scope.schedulerIds.selected).then(function (res) {
                        success('running', host, port);
                    }, function (err) {

                    });
                }, function (err) {

                });

            } else if ((objectType == 'supervisor' || objectType == 'master') && action == 'terminateAndRestartWithin') {
                vm.getTimeout(host, port);


            }
            else if ((objectType == 'supervisor' || objectType == 'master') && action == 'pause') {
                JobSchedulerService.pause(host, port, $scope.schedulerIds.selected).then(function (res) {
                    success('paused', host, port);
                }, function (err) {

                });

            } else if ((objectType == 'supervisor' || objectType == 'master') && action == 'continue') {
                JobSchedulerService.continue(host, port, $scope.schedulerIds.selected).then(function (res) {
                    success('running', host, port);
                }, function (err) {

                });

            } else if (objectType == 'cluster' && action == 'terminate') {
                JobSchedulerService.terminateCluster({jobschedulerId: $scope.schedulerIds.selected}).then(function (res) {
                    clusterSuccess('stopped', host, port);
                }, function (err) {

                });

            } else if (objectType == 'cluster' && action == 'terminateFailsafe') {
                JobSchedulerService.terminateFailsafeCluster({jobschedulerId: $scope.schedulerIds.selected}).then(function (res) {
                    clusterSuccess('stopped', host, port);
                }, function (err) {

                });

            } else if (objectType == 'cluster' && action == 'restart') {
                JobSchedulerService.restartCluster({jobschedulerId: $scope.schedulerIds.selected}).then(function (res) {
                    clusterSuccess('running', host, port);
                }, function (err) {

                });

            }


            function clusterSuccess(state) {

                if (vm.clusterStatusData.supervisors.length == 0) {
                    drawForRemainings();
                }
                angular.forEach(vm.clusterStatusData.supervisors, function (supervisor, sIndex) {
                    states[supervisor.host + supervisor.port] = state;
                    angular.forEach(supervisor.masters, function (master, mIndex) {
                        states[master.host + master.port] = state;
                        if (sIndex == vm.clusterStatusData.supervisors.length - 1 && mIndex == supervisor.masters.length - 1) {
                            drawForRemainings();
                        }
                    })
                });

                function drawForRemainings() {
                    if (vm.clusterStatusData.members.masters.length == 0) {
                        determineClusterStatus();
                        return;
                    }
                    angular.forEach(vm.clusterStatusData.members.masters, function (master, index) {
                        states[master.host + master.port] = state;
                        if (index == vm.clusterStatusData.members.masters.length - 1) {
                            determineClusterStatus();
                        }
                    })
                }
            }
        };

        function success(state, host, port) {
            //console.log("Here02 " + host + port);
            states[host + port] = state;
            //console.log("Here02 states " + states[host + port]);

        }

        /*-------------Menu active function call-------------------*/
        vm.terminate = function () {
            JobSchedulerService.terminate({jobschedulerId: $scope.schedulerIds.selected}).then(function (res) {

            });
        };
        vm.restart = function () {
            JobSchedulerService.restart({jobschedulerId: $scope.schedulerIds.selected}).then(function (res) {

            });
        };
        vm.terminateFailSafe = function () {
            JobSchedulerService.terminateFailSafe({jobschedulerId: $scope.schedulerIds.selected}).then(function (res) {

            });
        };

        vm.criterion = {};
        vm.criterion.timeout = 60;
        vm.getTimeout = function (host, port) {

            var modalInstance = $uibModal.open({
                templateUrl: 'modules/core/template/get-timeout-dialog.html',
                controller: 'DialogCtrl',
                scope: vm,
                backdrop: 'static'
            });
            modalInstance.result.then(function () {
                JobSchedulerService.terminateWithin(host, port, $scope.schedulerIds.selected, vm.criterion.timeout).then(function (res) {
                    JobSchedulerService.restartWithin(host, port, $scope.schedulerIds.selected, vm.criterion.timeout).then(function (res) {
                        success('running', host, port);
                    }, function (err) {

                    });
                }, function (err) {

                });
            }, function () {

            });
        };
        /*----------------- Daily plan overview -----------------*/
        vm.filter = {};
        vm.filter.range = "today";
        getDailyPlans();

        function getDailyPlans() {
            var obj = {};
            obj.jobschedulerId = $scope.schedulerIds.selected;
            if (vm.filter.range == "today") {
                obj.dateFrom = new Date();
            } else {
                obj.dateFrom = '24h';
            }
            DailyPlanService.getPlans(obj).then(function (res) {
                vm.planItemData = res.planItems;
                filterData();
            }, function (err) {

            })
        }

        function filterData() {
            vm.waiting = 0;
            vm.late = 0;
            vm.lateSuccess = 0;
            vm.lateError = 0;
            vm.executed = 0;
            vm.error = 0;

            if (!vm.planItemData) {
                return;
            }

            vm.totalPlanData = vm.planItemData.length;
            angular.forEach(vm.planItemData, function (value) {
                var time;
                if (!value.startTime) {
                    time = moment(value.plannedStartTime).diff(moment(new Date()));
                    if (time < 0) {
                        vm.late++;
                    } else {
                        vm.waiting++;
                    }
                } else if (value.state._text == 'SUCCESSFUL' && value.startTime) {
                    time = moment(value.plannedStartTime).diff(moment(value.startTime));
                    if (time == 0) {
                        vm.executed++;
                    } else {
                        vm.lateSuccess++;
                    }
                } else {
                    time = moment(value.plannedStartTime).diff(moment(value.startTime));
                    if (time == 0) {
                        vm.error++;
                    } else {
                        vm.lateError++;
                    }
                }
            });
            vm.waiting = getPlanPercent(vm.waiting);
            vm.late = getPlanPercent(vm.late);
            vm.executed = getPlanPercent(vm.executed);
            vm.lateSuccess = getPlanPercent(vm.lateSuccess);
            vm.error = getPlanPercent(vm.error);
            vm.lateError = getPlanPercent(vm.lateError);
        }

        function getPlanPercent(status) {
            return (status / vm.totalPlanData) * 100;

        }


        startPolling();

        function startPolling() {
            if ($rootScope.config.agentClusterStatus.polling) {
                poll1();
            }
            if ($rootScope.config.orderOverviewWidget.polling) {
                poll2();
            }
            if ($rootScope.config.dailyPlanWidget.polling) {
                poll3();
            }
        }

        var interval1, interval2, interval3;

        function poll1() {
            interval1 = $interval(function () {
                vm.getAgentCluster();

            }, $rootScope.config.agentClusterStatus.interval * 1000)
        }

        function poll2() {
            interval2 = $interval(function () {
                vm.loadOrderSnapshot();
            }, $rootScope.config.orderOverviewWidget.interval * 1000)
        }

        function poll3() {
            interval3 = $interval(function () {
                getDailyPlans();
            }, $rootScope.config.dailyPlanWidget.interval * 1000)
        }

        $scope.$on('$destroy', function () {
            $interval.cancel(interval1);
            $interval.cancel(interval2);
            $interval.cancel(interval3);

        });


    }


    DailyPlanCtrl.$inject = ['$scope', '$timeout', 'gettextCatalog', 'moment', 'orderByFilter', '$uibModal', 'SavedFilter', 'toasty', 'OrderService', 'DailyPlanService', '$interval', '$rootScope', 'JobChainService'];
    function DailyPlanCtrl($scope, $timeout, gettextCatalog, moment, orderBy, $uibModal, SavedFilter, toasty, OrderService, DailyPlanService, $interval, $rootScope, JobChainService) {

        var vm = $scope;

        vm.todayDate = new Date();
        vm.pageSize = 10;
        vm.currentPage = 1;

        vm.filter = {};
        vm.filter.range = "today";
        vm.filter.sortBy = "name";
        vm.filter.status = 'all';
        vm.range = 'period';
        vm.showPanel = '';
        vm.showLogPanel = undefined;
        vm.object = {};
        vm.tree = [];
        var selectedFiltered;
        var promise1;


        vm.savedDailyPlanFilter = JSON.parse(SavedFilter.dailyPlanFilters) || {};
        vm.savedDailyPlanFilter.list = vm.savedDailyPlanFilter.list || [];
        vm.savedDailyPlanFilter.selected = vm.savedDailyPlanFilter.favorite;

        if (vm.savedDailyPlanFilter.selected) {
            angular.forEach(vm.savedDailyPlanFilter.list, function (value) {
                if (value.name == vm.savedDailyPlanFilter.selected) {
                    selectedFiltered = value;
                }
            });
        }

        vm.savedIgnoreList = JSON.parse(SavedFilter.ignoreList) || {};
        vm.savedIgnoreList.dailyPlans = vm.savedIgnoreList.dailyPlans || [];
        vm.savedIgnoreList.isEnable = vm.savedIgnoreList.isEnable || false;

        setDateRange();

        function setDateRange(range) {
            var from = new Date();
            var to = new Date();
            if (range == 'today' || !range) {
                from.setHours(0);
                from.setMinutes(0);
                from.setSeconds(0);
                to.setDate(to.getDate() + 1);
                to.setHours(0);
                to.setMinutes(0);
                to.setSeconds(0);
            } else if (range == 'next-24-hours') {
                to.setHours(to.getHours() + 24);
            }

            vm.filter.from = from;
            vm.filter.to = to;
        }

        vm.getPlans = function () {
            if (vm.range != 'period') {
                vm.filter.range = undefined;
            }
            filterData();
        };


        vm.exportToExcel = function () {
            $('#exportToExcelBtn').attr("disabled", true);

            $('#dailyPlanTableId').table2excel({
                exclude: ".noExl",
                filename: "jobscheduler-jobchain",
                fileext: ".xlsx",
                exclude_img: false,
                exclude_links: false,
                exclude_inputs: false
            });

            $('#exportToExcelBtn').attr("disabled", false);
        };


        $scope.options = {
            mode: 'custom',
            scale: 'hour',
            sortMode: undefined,
            sideMode: 'TreeTable',
            daily: false,
            maxHeight: window.innerHeight - 300,
            width: false,
            zoom: 1,
            treeTableColumns: ['model.name', 'model.orderId', 'model.status'],
            columnsHeaders: {
                'model.name': gettextCatalog.getString('label.processesPlanned'),
                'model.orderId': gettextCatalog.getString('label.orderId'),
                'model.status': gettextCatalog.getString('label.status')
            },
            columnsClasses: {
                'model.name': 'gantt-column-name',
                'model.orderId': 'gantt-column-from',
                'model.status': 'gantt-column-to'
            },
            columnsHeaderContents: {
                'model.name': '{{getHeader()}}',
                'mode.lorderId': '{{getHeader()}}',
                'model.status': '{{getHeader()}}'
            },
            autoExpand: 'none',
            taskOutOfRange: 'truncate',
            rowContent: '<i class="fa fa-align-justify"></i> {{row.model.orderId}}',
            taskContent: '<i class="fa fa-tasks"></i> {{task.model.orderId}}',
            allowSideResizing: true,
            labelsEnabled: true,
            currentDate: 'line',
            currentDateValue: new Date(),
            draw: false,
            readOnly: false,
            groupDisplayMode: 'group',
            shrinkToFit: true,
            columnMagnet: '15 minutes',
            targetDataAddRowIndex: undefined,
            api: function (api) {
                api.core.on.ready($scope, function () {
                    $scope.load();
                });
            }
        };

        $scope.canAutoWidth = function (scale) {
            if (scale.match(/.*?hour.*?/) || scale.match(/.*?minute.*?/)) {
                return false;
            }
            return true;
        };

        $scope.getColumnWidth = function (widthEnabled, scale, zoom) {
            if (!widthEnabled && $scope.canAutoWidth(scale)) {
                return undefined;
            }
            if (scale.match(/.*?week.*?/)) {
                return 150 * zoom;
            }
            if (scale.match(/.*?month.*?/)) {
                return 300 * zoom;
            }
            if (scale.match(/.*?quarter.*?/)) {
                return 500 * zoom;
            }
            if (scale.match(/.*?year.*?/)) {
                return 800 * zoom;
            }
            return 40 * zoom;
        };


        $scope.load = function () {
            DailyPlanService.getPlans({jobschedulerId: $scope.schedulerIds.selected}).then(function (res) {
                vm.temp = res.planItems;
                filterData();
            }, function (err) {

            })
        };


        vm.sortBy = function (propertyName) {
            vm.reverse = (propertyName !== null && vm.propertyName === propertyName) ? !vm.reverse : false;
            vm.propertyName = propertyName;
            vm.plans = orderBy(vm.plans, vm.propertyName, vm.reverse);
            prepareGanttData(vm.plans);

        };

        vm.mainSortBy = function (propertyName) {
            vm.sortReverse = !vm.sortReverse;
            vm.filter.sortBy = propertyName;
            vm.plans = orderBy(vm.plans, vm.filter.sortBy, vm.sortReverse);
            prepareGanttData(vm.plans);
        };


        vm.showPanel = '';
        vm.showPanelFuc = function (value) {
            vm.showPanel = value;
            vm.hidePanel = !vm.hidePanel;
        };
        vm.hidePanelFuc = function () {
            vm.showPanel = '';
            vm.hidePanel = !vm.hidePanel;
        };

        vm.showLogFuc = function (plan) {
            vm.showLogPanel = plan;
            var filter = [];
            filter[0] = {};
            filter[0].jobChain = plan.jobChain;
            filter[0].orderId = plan.orderId;
            OrderService.histories(filter).then(function (res) {
                vm.histories = res.history;
            }, function (err) {

            });
            vm.steps = [];
        };

        vm.applyFilter = function () {
            vm.dailyPlanFilter = {};
            vm.isUnique = true;
            var modalInstance = $uibModal.open({
                templateUrl: 'modules/core/template/daily-plan-filter-dialog.html',
                controller: 'DialogCtrl',
                scope: vm,
                backdrop: 'static'
            });
            modalInstance.result.then(function () {

                vm.savedDailyPlanFilter.list.push(vm.dailyPlanFilter);

                if (vm.savedDailyPlanFilter.list.length == 1) {
                    vm.savedDailyPlanFilter.selected = vm.dailyPlanFilter.name;
                    vm.savedDailyPlanFilter.favorite = vm.dailyPlanFilter.name;
                    vm.loadPlanData();
                }
                SavedFilter.setDailyPlan(vm.savedDailyPlanFilter);
                SavedFilter.save();

            }, function () {

            });
        };

        vm.editFilters = function () {
            vm.filters = vm.savedDailyPlanFilter;
            var modalInstance = $uibModal.open({
                templateUrl: 'modules/core/template/edit-filter-dialog.html',
                controller: 'DialogCtrl',
                scope: vm
            });
        };

        vm.editFilter = function (filter) {
            vm.filterName = filter.name;
            vm.dailyPlanFilter = angular.copy(filter);
            vm.paths = vm.dailyPlanFilter.paths;
            vm.object.paths = vm.paths;
            vm.isUnique = true;
            var modalInstance = $uibModal.open({
                templateUrl: 'modules/core/template/edit-daily-plan-filter-dialog.html',
                controller: 'DialogCtrl',
                scope: vm
            });
            modalInstance.result.then(function () {
                angular.forEach(vm.savedDailyPlanFilter.list, function (value, index) {
                    if (value.name == filter.name) {
                        vm.savedDailyPlanFilter.list[index] = vm.dailyPlanFilter;
                    }
                });

                if (vm.savedDailyPlanFilter.selected == vm.filterName) {
                    vm.savedDailyPlanFilter.selected = vm.dailyPlanFilter.name;
                    selectedFiltered = vm.dailyPlanFilter;
                    vm.loadPlanData();
                }
                if (vm.savedDailyPlanFilter.favorite == vm.filterName) {
                    vm.savedDailyPlanFilter.favorite = vm.dailyPlanFilter.name;
                }


                SavedFilter.setDailyPlan(vm.savedDailyPlanFilter);
                SavedFilter.save();
                vm.filterName = undefined;
            }, function () {
                vm.filterName = undefined;
            });
        };

        vm.deleteFilter = function () {
            angular.forEach(vm.savedDailyPlanFilter.list, function (value, index) {
                if (value.name == vm.dailyPlanFilter.name) {
                    toasty.success({
                        title: value.name + ' ' + gettextCatalog.getString('message.filterDeleteSuccessfully'),
                        msg: ''
                    });
                    vm.savedDailyPlanFilter.list.splice(index, 1);
                }
            });
            if (vm.savedDailyPlanFilter.list.length == 0) {
                vm.savedDailyPlanFilter = {};
                selectedFiltered = undefined;
            } else if (vm.savedDailyPlanFilter.selected == vm.dailyPlanFilter.name) {
                vm.savedDailyPlanFilter.selected = undefined;
                selectedFiltered = undefined;
                vm.loadPlanData();
            }
            SavedFilter.setDailyPlan(vm.savedDailyPlanFilter);
            SavedFilter.save();
        };

        vm.favorite = function (filter) {
            vm.savedDailyPlanFilter.favorite = filter;
            vm.savedDailyPlanFilter.selected = filter;
            selectedFiltered = undefined;
            SavedFilter.setDailyPlan(vm.savedDailyPlanFilter);
            SavedFilter.save();
            vm.loadPlanData();
        };

        vm.checkFilterName = function () {
            vm.isUnique = true;

            angular.forEach(vm.savedDailyPlanFilter.list, function (value) {
                if (!vm.filterName) {
                    if (vm.dailyPlanFilter.name == value.name) {
                        vm.isUnique = false;
                    }
                } else {
                    if (value.name != vm.filterName) {
                        if (vm.dailyPlanFilter.name == value.name) {
                            vm.isUnique = false;
                        }
                    }
                }
            });
        };

        vm.changeFilter = function (filter) {
            if (filter)
                vm.savedDailyPlanFilter.selected = filter.name;
            else
                vm.savedDailyPlanFilter.selected = filter;
            selectedFiltered = filter;
            SavedFilter.setDailyPlan(vm.savedDailyPlanFilter);
            SavedFilter.save();
            vm.loadPlanData();
        };

        function applySavedFilter(data) {

                if (selectedFiltered) {
                    angular.forEach(vm.temp, function (res) {
                        var flag = true;

                        if (selectedFiltered.regex && res.orderId) {
                            if (!res.orderId.match(selectedFiltered.regex)) {
                                flag = false;
                            }
                        }


                        if (flag && selectedFiltered.state && res.state._text) {
                            var state;
                            if (res.state._text == "PLANNED") {
                                state = "WAITING";
                            } else if (res.state._text == "SUCCESSFUL" || res.state._text == "FAILED") {
                                state = "EXECUTED";
                            }
                            if (res.late) {
                                state = "LATE";
                            }
                            if (selectedFiltered.state.indexOf(state) === -1) {
                                flag = false;
                            }
                        }

                        if (selectedFiltered.processPlanned && res.job && res.job != "NULL") {
                            if (!res.job.match(selectedFiltered.processPlanned)) {
                                flag = false;
                            }
                        }

                        if (selectedFiltered.processPlanned && res.jobChain && res.job == "NULL") {
                            if (!res.jobChain.match(selectedFiltered.processPlanned)) {
                                flag = false;
                            }
                        }

                        var fromDate;
                        var toDate;

                        if (flag && selectedFiltered.planned && res.plannedStartTime) {
                            if (/^\s*(now\s*\+)\s*(\d+)\s*$/i.test(selectedFiltered.planned)) {
                                fromDate = new Date();
                                toDate = new Date();
                                var seconds = parseInt(/^\s*(now\+)(\d+)\s*$/i.exec(selectedFiltered.planned)[2]);
                                toDate.setSeconds(toDate.getSeconds() + seconds);
                            } else if (/^\s*(Today)\s*$/i.test(selectedFiltered.planned)) {
                                fromDate = new Date();
                                fromDate.setHours(0);
                                fromDate.setMinutes(0);
                                toDate = new Date();
                                toDate.setHours(23);
                                toDate.setMinutes(59);
                            } else if (/^\s*(now)\s*$/i.test(selectedFiltered.planned)) {
                                fromDate = new Date();
                                toDate = new Date();
                            } else if (/^\s*(\d+):(\d+)\s*(am|pm)\s*to\s*(\d+):(\d+)\s*(am|pm)\s*$/i.test(selectedFiltered.planned)) {
                                var time = /^\s*(\d+):(\d+)\s*(am|pm)\s*to\s*(\d+):(\d+)\s*(am|pm)\s*$/i.exec(selectedFiltered.planned)
                                fromDate = new Date();
                                if (/(pm)/i.test(time[3]) && parseInt(time[1]) != 12) {
                                    fromDate.setHours(parseInt(time[1]) + 12);
                                } else {
                                    fromDate.setHours(parseInt(time[1]));
                                }

                                fromDate.setMinutes(parseInt(time[2]));
                                toDate = new Date();
                                if (/(pm)/i.test(time[6]) && parseInt(time[4]) != 12) {
                                    toDate.setHours(parseInt(time[4]) + 12);
                                } else {
                                    toDate.setHours(parseInt(time[4]));
                                }
                                toDate.setMinutes(parseInt(time[5]));
                            }
                        }

                        if (flag && selectedFiltered.fromDate && res.plannedStartTime) {
                            if (selectedFiltered.fromTime) {
                                fromDate = new Date(selectedFiltered.fromDate);
                                selectedFiltered.fromTime = new Date(selectedFiltered.fromTime);
                                fromDate.setHours(selectedFiltered.fromTime.getHours());
                                fromDate.setMinutes(selectedFiltered.fromTime.getMinutes());
                                fromDate.setSeconds(selectedFiltered.fromTime.getSeconds());
                            }
                        }

                        if (flag && selectedFiltered.toDate && res.plannedStartTime) {
                            if (selectedFiltered.toTime) {
                                toDate = new Date(selectedFiltered.toDate);
                                selectedFiltered.toTime = new Date(selectedFiltered.toTime);
                                toDate.setHours(selectedFiltered.toTime.getHours());
                                toDate.setMinutes(selectedFiltered.toTime.getMinutes());
                                toDate.setSeconds(selectedFiltered.toTime.getSeconds());
                            }
                        }


                        if (fromDate && toDate) {
                            console.log("from date " + fromDate + "toDate " + toDate);
                            if (fromDate > new Date(moment(res.plannedStartTime)) || toDate < new Date(moment(res.plannedStartTime))) {
                                flag = false;
                            }
                        }


                        if (flag) {
                            data.push(res);
                        }


                    });
                }

        }

        function filterData() {
            var data = [];
            if (!vm.savedDailyPlanFilter.selected) {
                data = vm.temp;
            } else {
                applySavedFilter(data);
            }
            var to = new Date();
            var from = new Date();

            if (vm.range == 'dateRange') {
                from = vm.filter.from;
                to = vm.filter.to;
            } else {
                if (vm.filter.range == 'today') {
                    from.setHours(0);
                    from.setMinutes(0);
                    from.setSeconds(0);
                    to.setHours(0);
                    to.setMinutes(0);
                    to.setSeconds(0);
                    to.setDate(to.getDate() + 1);
                    setDateRange('today');
                } else if (vm.filter.range == 'next-24-hours') {
                    to.setDate(to.getDate() + 1);
                    setDateRange('next-24-hours');
                }
            }


            var data2 = [];

            angular.forEach(data, function (value) {

                var flag = true;
                if (new Date(value.plannedStartTime) < from || new Date(value.plannedStartTime) > to) {
                    flag = false;
                }

                if (vm.filter.status && vm.filter.status != 'all' && value.state._text) {

                    if (vm.filter.status == "WAITING" && value.state._text.indexOf("PLANNED") === -1) {
                        flag = false;
                    } else if (vm.filter.status == "LATE" && !value.late) {
                        flag = false;
                    } else if (vm.filter.status == "EXECUTED" && value.state._text.indexOf("SUCCESSFUL") === -1 && value.state._text.indexOf("FAILED") === -1) {
                        flag = false;
                    }
                }

                if (flag) {
                    data2.push(value);
                }
            });

            vm.plans = data2;
            prepareGanttData(data2);
            vm.isLoading = true;
            console.log("Data " + vm.data.length);
        }

        vm.loadPlanData = function(){
            filterData();
        }


        function prepareGanttData(data2) {

            var minNextStartTime;
            var maxEndTime;
            var orders = [];
            data2 = orderBy(data2, 'plannedStartTime', false);
            angular.forEach(data2, function (order, index) {
                orders[index] = {};
                orders[index].tasks = [];
                orders[index].tasks[0] = {};
                if (order.job != "NULL") {
                    orders[index].name = order.job;
                    orders[index].orderId = '-';
                } else {
                    orders[index].name = order.jobChain.substring(order.jobChain.lastIndexOf('/') + 1, order.jobChain.length);
                    orders[index].orderId = order.orderId;
                }

                vm.plans[index].processedPlanned = orders[index].name;
                orders[index].tasks[0].name = orders[index].name;
                orders[index].status = order.state._text;
                vm.plans[index].status = order.state._text;
                if (order.state._text == 'SUCCESSFUL') {
                    orders[index].tasks[0].color = "#7ab97a";
                } else if (order.state._text == 'FAILED') {
                    orders[index].tasks[0].color = "#e86680";
                }
                else if (order.late) {
                    orders[index].tasks[0].color = "rgba(255, 195, 0, .9)";
                }

                orders[index].tasks[0].from = new Date(order.plannedStartTime);

                if (!minNextStartTime || minNextStartTime > new Date(order.plannedStartTime)) {
                    minNextStartTime = new Date(order.plannedStartTime);
                }
                if (!maxEndTime || maxEndTime < new Date(order.expectedEndTime)) {
                    maxEndTime = new Date(order.expectedEndTime);
                }
                orders[index].tasks[0].to = new Date(order.expectedEndTime);

            });

            if (minNextStartTime) {
                minNextStartTime.setMinutes(0);
                minNextStartTime.setHours(0);
                $scope.options.fromDate = minNextStartTime;
                var to = new Date(minNextStartTime);
                to.setHours(23);
                if (maxEndTime > to) {
                    $scope.options.toDate = maxEndTime;
                } else {
                    $scope.options.toDate = to;
                }

                console.log("Smallest from01 " + minNextStartTime);
                console.log("Smallest to01 " + to);


            }
            console.log("Task 0 " + JSON.stringify(orders[0]));
            vm.data = orderBy(orders, 'plannedStartTime');

            promise1 = $timeout(function () {
                $('#div').animate({
                    scrollLeft: $("#gantt-current-date-line").offset().left
                }, 800);
            }, 4000);
        }

        vm.validPlanned = true;
        vm.checkPlanned = function () {
            vm.validPlanned = true;
            if (!vm.dailyPlanFilter.planned || /^\s*$/i.test(vm.dailyPlanFilter.planned) || /^\s*(now\s*\+)\s*(\d+)\s*$/i.test(vm.dailyPlanFilter.planned) || /^\s*(now)\s*$/i.test(vm.dailyPlanFilter.planned) || /^\s*(Today)\s*$/i.test(vm.dailyPlanFilter.planned)
                || /^\s*(\d+):(\d+)\s*(am|pm)\s*to\s*(\d+):(\d+)\s*(am|pm)\s*$/i.test(vm.dailyPlanFilter.planned)) {
            } else {
                vm.validPlanned = false;
            }
        };

        vm.filter_tree = {};

        vm.expanding_property = {
            field: "name"
        };
        vm.getTreeStructure = function () {

            $('#treeModal').modal('show');
            JobChainService.tree({
                jobschedulerId: vm.schedulerIds.selected,
                compact: true
            }).then(function (res) {

                if (res.folders.length > 1) {
                    vm.tree = res.folders;
                } else {
                    vm.tree = res.folders[0].folders;
                }

            }, function (err) {

            });
        };


        vm.treeExpand = function (data) {
            angular.forEach(vm.object.paths, function (value) {
                if (data.path == value) {
                    if (data.folders.length > 0) {
                        angular.forEach(data.folders, function (res) {
                            vm.object.paths.push(res.path);
                        });
                    }
                }
            });
        };

        vm.object.paths = [];
        var watcher = $scope.$watchCollection('object.paths', function (newNames) {
            if (newNames && newNames.length > 0) {
                vm.paths = newNames;
            }
        });

        vm.addJobChainPaths = function () {
            vm.dailyPlanFilter.paths = vm.paths;
        };


        function contextmenu() {
            vm.menuOptions = [
                [gettextCatalog.getString('button.editIgnoreList'), function () {
                    vm.editIgnoreList();
                }],
                [gettextCatalog.getString('button.disableIgnoreList'), function () {
                    vm.enableDisableIgnoreList(false);
                }, vm.savedIgnoreList.isEnable],
                [gettextCatalog.getString('button.enableIgnoreList'), function () {
                    vm.enableDisableIgnoreList(true);
                }, vm.savedIgnoreList.isEnable],
                [gettextCatalog.getString('button.resetIgnoreList'), function () {
                    vm.resetIgnoreList();
                }]
            ];
        }

        contextmenu();
        startPolling();

        function startPolling() {
            if ($rootScope.config.dailyPlan.polling) {
                poll();
            }
        }

        var interval;

        function poll() {
            interval = $interval(function () {
                vm.loadPlanData();
            }, $rootScope.config.dailyPlan.interval * 1000)

        }

        $scope.$on('$destroy', function () {
            if (interval)
                $interval.cancel(interval);
            if (promise1)
                $timeout.cancel(promise1);
            watcher();

        });


    }
})();
