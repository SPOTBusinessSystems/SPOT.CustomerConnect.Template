/// <reference path="../../../typings/index.d.ts" />
/// <reference path="../../../Source/Default/Components/index.d.ts" />

interface IStateParams extends ng.ui.IStateParamsService {

}

class StateParams implements IStateParams {
    public theme: string;
    public themeurl: string;
    public cssurl: string;
}